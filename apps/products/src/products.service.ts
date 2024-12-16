import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { ProductEvents } from '../../../shared/events/product.events';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async createProduct(createProductDto: any): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    if (!createdProduct) {
      throw new BadRequestException('Failed to create product');
    }
    return createdProduct.save();
  }

  async getAllProducts(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  @ProductEvents.GetProductById()
  async getProductById(id: string): Promise<Product> {
    return this.productModel.findById(id).exec();
  }
  @ProductEvents.UpdateProduct()
  async updateProduct({id, updateProductDto}: {id: string, updateProductDto: any}): Promise<Product> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return deletedProduct;
  }
}
