import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramUpdate } from './telegram.update';
import { MenuModule } from '../menu/menu.module';
import { OrdersModule } from '../orders/orders.module'; // Für das spätere Abschicken der Bestellung
import { UserSessionEntity } from '../database/entities/user-session.entity';
import { AiOrderParserService } from './ai-order-parser.service';

@Module({
  imports: [
    HttpModule,
    MenuModule,
    OrdersModule,
    TypeOrmModule.forFeature([UserSessionEntity]), // Session-Entity für TypeORM registrieren
  ],
  providers: [TelegramUpdate, AiOrderParserService],
})
export class TelegramModule {}
