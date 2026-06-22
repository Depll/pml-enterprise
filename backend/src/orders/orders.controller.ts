import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
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

  // NEU: Endpunkt, um den Status einer Bestellung zu aktualisieren (z.B. PATCH /orders/12/status)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: number,
    @Body('status') status: string,
  ): Promise<Order> {
    return await this.ordersService.updateStatus(id, status);
  }
}
