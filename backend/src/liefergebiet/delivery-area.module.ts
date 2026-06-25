import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryAreaEntity } from '../database/entities/delivery-area.entity';
import { DeliveryAreaService } from './delivery-area.service';
import { DeliveryAreaController } from './delivery-area.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryAreaEntity])],
  controllers: [DeliveryAreaController],
  providers: [DeliveryAreaService],
  exports: [DeliveryAreaService],
})
export class DeliveryAreaModule {}
