import { Module } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherEntity } from '../database/entities/voucher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VoucherEntity])],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
