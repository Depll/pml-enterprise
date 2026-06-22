import { Controller, Post, Get, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from '../database/entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() orderData: any): Promise<Order> {
    return await this.ordersService.createOrder(orderData);
  }

  @Get()
  async findAll(): Promise<Order[]> {
    return await this.ordersService.findAllOrders();
  }
}
