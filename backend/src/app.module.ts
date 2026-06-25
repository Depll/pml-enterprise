import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Neue englische Entities importieren
import { CategoryEntity } from './database/entities/category.entity';
import { ProductEntity } from './database/entities/product.entity';
import { IngredientEntity } from './database/entities/ingredient.entity';
import { DeliveryAreaEntity } from './database/entities/delivery-area.entity';
import { Order } from './database/entities/order.entity';
import { OrderPosition } from './database/entities/order-position.entity';

// Services & Module importieren
import { SeedService } from './database/seeds/seed.service';
import { MenuModule } from './menu/menu.module';
import { DeliveryAreaModule } from './liefergebiet/delivery-area.module';
import { OrdersModule } from './orders/orders.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env', // Hier ist der korrekte Pfad zu deiner .env-Datei!
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD, // Holt das Passwort jetzt sicher aus der echten Datei
      database: process.env.DB_DATABASE,
      entities: [
        CategoryEntity,
        ProductEntity,
        IngredientEntity,
        DeliveryAreaEntity,
        Order,
        OrderPosition,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      CategoryEntity,
      ProductEntity,
      IngredientEntity,
      DeliveryAreaEntity,
    ]),
    MenuModule,
    DeliveryAreaModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
