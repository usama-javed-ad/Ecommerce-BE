import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { ProductEvents } from '../../../shared/events/product.events';
import { UserEvents } from '../../../shared/events/user.events';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly productEvents: ProductEvents,
    private readonly userEvents: UserEvents
  ) {}

  async createOrder(createOrderDto: any, userId: string): Promise<any> {
    
    const product = await this.productEvents.getProductById(createOrderDto.productId);
    if(product.stock < createOrderDto.quantity || product.stock === 0 || product.status === "out_of_stock"){
      // throw new Error('Stock not available');
      return {message: 'Stock not available'}
    }
    const createdOrder = new this.orderModel({ ...createOrderDto, userId });
    const savedOrder = await createdOrder.save();
    const updatedProduct = await this.productEvents.updateProduct(createOrderDto.productId, { stock: product.stock - createOrderDto.quantity }) 
    return {message: 'Order created successfully', order: savedOrder};
  }


  async getOrderById(id: string): Promise<any> {
    const order = await this.orderModel.findById(id).lean();
    if (!order) {
      throw new Error('Order not found');
    }
    const product = await this.productEvents.getProductById(order.productId);
    const user = await this.userEvents.getUserById(order.userId);
    const {_id:productId, name,description,price} = product
    const orderWithProduct = {_id: order._id, product:{
      _id: productId,name,description,price},
      user:{
        name: user.username,
      }

    }
    return orderWithProduct;
  }

  async cancelOrder(id: string): Promise<any> {
    const order = await this.orderModel.findById(id).lean();
    if (!order) {
      throw new Error('Order not found');
    }
    const product = await this.productEvents.getProductById(order.productId);
    const updatedProduct = await this.productEvents.updateProduct(order.productId, { stock: product.stock + order.quantity }) 
    await this.orderModel.findByIdAndDelete(id);
    return {message: 'Order cancelled successfully'};
  }

  async getAllOrdersByUser(userId: string): Promise<any> {
    const orders = await this.orderModel.find({ userId: userId }).lean();
    const userOrders = await Promise.all( orders.map(async (order) => {
      const product = await this.productEvents.getProductById(order.productId);
      return {
        product : {
          _id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
        },
        quantity: order.quantity
      };
    })
  );
    return userOrders;
  }
}
