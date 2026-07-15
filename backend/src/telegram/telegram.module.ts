import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramUpdate } from './telegram.update';
import { MenuModule } from '../menu/menu.module';
import { OrdersModule } from '../orders/orders.module';
import { UserSessionEntity } from '../database/entities/user-session.entity';
import { AiOrderParserService } from './ai-order-parser.service';
import { DialogHelperService } from './dialog-helper.service'; // Neu importiert!

@Module({
  imports: [
    HttpModule,
    MenuModule,
    forwardRef(() => OrdersModule),
    TypeOrmModule.forFeature([UserSessionEntity]),
  ],
  providers: [
    TelegramUpdate,
    AiOrderParserService,
    DialogHelperService, // Neu als Provider registriert!
  ],
  exports: [DialogHelperService], // Exportiert, falls benötigt
})
export class TelegramModule {}
