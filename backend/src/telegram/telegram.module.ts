import { Module, forwardRef } from '@nestjs/common'; // forwardRef importieren!
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramUpdate } from './telegram.update';
import { MenuModule } from '../menu/menu.module';
import { OrdersModule } from '../orders/orders.module'; // Dein Orders Import
import { UserSessionEntity } from '../database/entities/user-session.entity';
import { AiOrderParserService } from './ai-order-parser.service';

@Module({
  imports: [
    HttpModule,
    MenuModule,
    forwardRef(() => OrdersModule), // <-- Auch hier mit forwardRef umwickeln!
    TypeOrmModule.forFeature([UserSessionEntity]),
  ],
  providers: [TelegramUpdate, AiOrderParserService],
})
export class TelegramModule {}
