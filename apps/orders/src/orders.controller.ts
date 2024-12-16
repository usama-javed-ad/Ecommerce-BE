// apps/orders/src/orders/orders.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '@app/shared/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    const userId = req.user.userId; // Extracted from JWT
    
    return this.ordersService.createOrder(createOrderDto, String(userId));
  }

  @Get(':id/cancel')
  async cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

  @Get(':id/orders')
  async getAllOrdersByUser(@Param('id') id: string) {
    return this.ordersService.getAllOrdersByUser(id);
  }
  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }


}