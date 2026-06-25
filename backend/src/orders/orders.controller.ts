import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from '../database/entities/order.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  async findAll(): Promise<Order[]> {
    return await this.ordersService.findAllOrders();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return await this.ordersService.updateStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.stornoReason,
    );
  }
}
