import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Order } from '../database/entities/order.entity';
import { OrderPosition } from '../database/entities/order-position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderPosition])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
