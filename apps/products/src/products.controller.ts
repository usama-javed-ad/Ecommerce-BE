import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, BadRequestException, HttpCode } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '@app/shared/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('create')
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get('/all')
  async getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Get(':id')
  @HttpCode(200)
  @HttpCode(404)
  async getProductById(@Param('id') id: string) {
    const product = await this.productsService.getProductById(id);
    if(!product)
    {
      throw new BadRequestException('Product not found');
    }
    return product;
  }
  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productsService.updateProduct({id, updateProductDto});
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
