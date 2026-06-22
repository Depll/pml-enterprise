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

  // GEÄNDERT: Nimmt jetzt Status AND optionalen Stornogrund entgegen
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: number,
    @Body() updateData: { status: string; stornoGrund?: string },
  ): Promise<Order> {
    // Falls dein Service bisher nur (id, status) erwartet hat, müssen wir hier
    // sicherstellen, dass er auch mit dem Grund umgehen kann.
    return await this.ordersService.updateStatus(
      id,
      updateData.status,
      updateData.stornoGrund,
    );
  }
}
