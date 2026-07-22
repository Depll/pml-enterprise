import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramUpdate } from './telegram.update';
import { MenuModule } from '../menu/menu.module';
import { OrdersModule } from '../orders/orders.module';
import { VouchersModule } from '../voucher/vouchers.module'; // NEU: VouchersModule importiert
import { UserSessionEntity } from '../database/entities/user-session.entity';
import { AiOrderParserService } from './ai-order-parser.service';
import { DialogHelperService } from './dialog-helper.service';

@Module({
  imports: [
    HttpModule,
    MenuModule,
    VouchersModule, // NEU: In imports hinzugefügt
    forwardRef(() => OrdersModule),
    TypeOrmModule.forFeature([UserSessionEntity]),
  ],
  providers: [TelegramUpdate, AiOrderParserService, DialogHelperService],
  exports: [DialogHelperService],
})
export class TelegramModule {}
