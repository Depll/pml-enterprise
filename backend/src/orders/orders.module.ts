import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../database/entities/order.entity';
import { OrderPosition } from '../database/entities/order-position.entity';
import { TelegramModule } from '../telegram/telegram.module'; // <-- Pfad zu deinem TelegramModule anpassen!

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderPosition]),
    TelegramModule, // <-- Hier importiert
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
