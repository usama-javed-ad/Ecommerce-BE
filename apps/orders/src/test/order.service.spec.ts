import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { MongoInMemory } from 'libs/tests/mongo-in-memory.util';
import { Order, OrderSchema} from '../schemas/order.schema';
import mongoose, { HydratedDocument, Model, Mongoose } from 'mongoose';
import { INestApplication } from '@nestjs/common';
import { OrdersController } from '@orders/orders.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '@app/shared/guards/jwt-auth.guard';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RedisService } from 'common/services/redis.service';
import { JwtStrategy } from '@app/shared/strategies/jwt.strategy';
import { mock } from 'jest-mock-extended';
import { ProductEvents } from '../../../../shared/events/product.events';
import { UserEvents } from '../../../../shared/events/user.events';

process.env.RABBIT_URI = "amqp://localhost:5672";

describe('OrdersService', () => {
    let app: INestApplication;
    let jwtToken: string;
    let ordersService: OrdersService;
    let orderModel: Model<HydratedDocument<Order>>;
  
    beforeAll(async () => {
      await MongoInMemory.connect();
      const uri = await MongoInMemory.getUri();
  
      const testingModule: TestingModule = await Test.createTestingModule({
        controllers: [OrdersController],
        imports: [
          MongooseModule.forRoot(uri),
          MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
          ]),
          PassportModule.register({ defaultStrategy: 'jwt' }),
          JwtModule.register({ secret: 'yourSecretKey' }),
        ],
        providers: [
          OrdersService,
          PassportModule,
          JwtStrategy,
          ProductEvents,
          UserEvents,
          { provide: JwtAuthGuard, useValue: { canActivate: () => true} },
          { provide: AmqpConnection, useValue: mock<AmqpConnection>() },
          { provide: JwtService, useValue: mock<JwtService>() },
          { provide: RedisService, useValue: mock<RedisService>() },
        ],
      }).compile();
  
      app = testingModule.createNestApplication();
      const jwtService = app.get(JwtService);
      jwtToken = jwtService.sign({ userId: 'test-user-id' }, { secret: 'yourSecretKey' });
      await app.init();

      ordersService = testingModule.get<OrdersService>(OrdersService);
      orderModel = app.get(getModelToken(Order.name));
    });
  
    afterAll(async () => {
      await app.close();
      await MongoInMemory.close();
    });
  
    beforeEach(async () => {
      // Clear the database before each test
      await MongoInMemory.clear();
    });

    describe('createOrder', () => {
        it('should create an order if stock is available', async () => {
          const mockProduct = {
            _id: new mongoose.Types.ObjectId().toHexString(),
            name: 'Test Product',
            stock: 10,
            status: 'available',
          };
    
          const mockCreateOrderDto = {
            productId: 'product-id',
            quantity: 5,
          };
    
          jest.spyOn(ordersService['productEvents'], 'getProductById').mockResolvedValue(mockProduct);
          jest.spyOn(ordersService['productEvents'], 'updateProduct').mockResolvedValue({
            ...mockProduct,
            stock: 5,
          });
    
          const result = await ordersService.createOrder(mockCreateOrderDto, 'test-user-id');
    
          expect(result.message).toBe('Order created successfully');
          expect(result.order).toMatchObject({
            productId: 'product-id',
            quantity: 5,
            userId: 'test-user-id',
          });
    
          const savedOrder = await orderModel.findOne().lean();
          expect(savedOrder).toBeDefined();
          expect(savedOrder.quantity).toBe(5);
        });
    
        it('should return a message if stock is not available', async () => {
          const mockProduct = {
            _id: 'product-id',
            name: 'Test Product',
            stock: 0,
            status: 'out_of_stock',
          };
    
          const mockCreateOrderDto = {
            productId: 'product-id',
            quantity: 5,
          };
    
          jest.spyOn(ordersService['productEvents'], 'getProductById').mockResolvedValue(mockProduct);
    
          const result = await ordersService.createOrder(mockCreateOrderDto, 'test-user-id');
    
          expect(result.message).toBe('Stock not available');
        });
      });

    describe('getOrderById', () => {
        it('should return an order with product and user details', async () => {
          const mockProduct = {
            _id: 'product-id',
            name: 'Test Product',
            description: 'Product Description',
            price: 100,
          };
    
          const mockUser = {
            _id: 'user-id',
            username: 'Test User',
          };
    
          const order = new orderModel({
            productId: 'product-id',
            userId: 'user-id',
            quantity: 2,
          });
          await order.save();
    
          jest.spyOn(ordersService['productEvents'], 'getProductById').mockResolvedValue(mockProduct);
          jest.spyOn(ordersService['userEvents'], 'getUserById').mockResolvedValue(mockUser);
    
          const result = await ordersService.getOrderById(order._id.toString());
    
          expect(result).toMatchObject({
            product: {
              _id: 'product-id',
              name: 'Test Product',
              description: 'Product Description',
              price: 100,
            },
            user: {
              name: 'Test User',
            },
          });
        });
    
        it('should throw an error if the order is not found', async () => {
          const fakeId = new mongoose.Types.ObjectId().toHexString();
    
          await expect(ordersService.getOrderById(fakeId)).rejects.toThrow('Order not found');
        });
      });
    
      describe('cancelOrder', () => {
        it('should cancel an order and update product stock', async () => {
          const mockProduct = {
            _id: 'product-id',
            name: 'Test Product',
            stock: 5,
          };
    
          const order = new orderModel({
            productId: 'product-id',
            userId: 'user-id',
            quantity: 2,
          });
          await order.save();
    
          jest.spyOn(ordersService['productEvents'], 'getProductById').mockResolvedValue(mockProduct);
          jest.spyOn(ordersService['productEvents'], 'updateProduct').mockResolvedValue({
            ...mockProduct,
            stock: 7,
          });
          const result = await ordersService.cancelOrder(order._id.toString());
    
          expect(result.message).toBe('Order cancelled successfully');
    
          const deletedOrder = await orderModel.findById(order._id).lean();
          expect(deletedOrder).toBeNull();
        });
    
        it('should throw an error if the order is not found', async () => {
          const fakeId = new mongoose.Types.ObjectId().toHexString();
    
          await expect(ordersService.cancelOrder(fakeId)).rejects.toThrow('Order not found');
        });
      });

      describe('getAllOrdersByUser', () => {
        it('should fetch all orders for a user', async () => {
            const mockUserId = 'user-id-123';
            const mockProductA = {
              _id: 'product-id-1',
              name: 'Product A',
              description: 'Description A',
              price: 100,
            };
            const mockProductB = {
              _id: 'product-id-2',
              name: 'Product B',
              description: 'Description B',
              price: 200,
            };
          
            // Insert mock orders
            const orderA = new orderModel({
              productId: mockProductA._id,
              userId: mockUserId,
              quantity: 2,
            });
            const orderB = new orderModel({
              productId: mockProductB._id,
              userId: mockUserId,
              quantity: 3,
            });
            await orderA.save();
            await orderB.save();
          
            // Mock external service calls
            jest.spyOn(ordersService['productEvents'], 'getProductById')
              .mockImplementation((id) => {
                if (id === mockProductA._id) return Promise.resolve(mockProductA);
                if (id === mockProductB._id) return Promise.resolve(mockProductB);
                return Promise.reject('Product not found');
              });
          
            // Call service method to fetch orders for the user
            const orders = await ordersService.getAllOrdersByUser(mockUserId);
          
            // Assertions
            expect(orders).toHaveLength(2);
            console.log("🚀 ~ expect ~ orders[0]:", orders[0])
            expect(orders[0]).toMatchObject({
              product: {
                _id: mockProductA._id,
                name: 'Product A',
                description: 'Description A',
                price: 100,
              },
              quantity: 2,
            });
          
            expect(orders[1]).toMatchObject({
              product: {
                _id: mockProductB._id,
                name: 'Product B',
                description: 'Description B',
                price: 200,
              },
              quantity: 3,
            });
          });          
      });
});
