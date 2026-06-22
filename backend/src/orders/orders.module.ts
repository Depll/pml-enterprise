import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../database/entities/order.entity';
import { OrderPosition } from '../database/entities/order-position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderPosition])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
