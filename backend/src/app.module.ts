import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramModule } from './telegram/telegram.module';

// Entities importieren
import { CategoryEntity } from './database/entities/category.entity';
import { ProductEntity } from './database/entities/product.entity';
import { IngredientEntity } from './database/entities/ingredient.entity';
import { DeliveryAreaEntity } from './database/entities/delivery-area.entity';
import { Order } from './database/entities/order.entity';
import { OrderPosition } from './database/entities/order-position.entity';
import { UserSessionEntity } from './database/entities/user-session.entity';
import { VoucherEntity } from './database/entities/voucher.entity';

// Services & Module importieren
import { SeedService } from './database/seeds/seed.service';
import { MenuModule } from './menu/menu.module';
import { DeliveryAreaModule } from './delivery-area/delivery-area.module';
import { OrdersModule } from './orders/orders.module';
import { VouchersModule } from './voucher/vouchers.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '../.env', // Pfad wenn aus dem backend-Ordner gestartet (npm run start:dev)
        '.env', // Lokaler Fallback
        './.env',
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        CategoryEntity,
        ProductEntity,
        IngredientEntity,
        DeliveryAreaEntity,
        Order,
        OrderPosition,
        UserSessionEntity,
        VoucherEntity,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      CategoryEntity,
      ProductEntity,
      IngredientEntity,
      DeliveryAreaEntity,
      UserSessionEntity,
      VoucherEntity, // <-- Hier die VoucherEntity hinzufügen
    ]),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN') || '',
      }),
      inject: [ConfigService],
    }),
    MenuModule,
    DeliveryAreaModule,
    OrdersModule,
    TelegramModule,
    VouchersModule, // <-- Hier in den Modul-Imports hinzugefügt!
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
