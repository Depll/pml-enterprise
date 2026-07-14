import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../database/entities/order.entity';
import { OrderPosition } from '../database/entities/order-position.entity';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderPosition]),
    forwardRef(() => TelegramModule), // <-- Hier sauber mit forwardRef gelöst
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // Exportieren, falls Telegram auf den Service zugreifen muss
})
export class OrdersModule {}
