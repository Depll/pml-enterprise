import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { KategorieEntity } from './database/entities/kategorie.entity';
import { ProduktEntity } from './database/entities/produkt.entity';
import { ZutatEntity } from './database/entities/zutat.entity';
import { Liefergebiet } from './database/entities/liefergebiet.entity';
import { Order } from './database/entities/order.entity';
import { OrderPosition } from './database/entities/order-position.entity';
import { SeedService } from './database/seeds/seed.service';
import { MenuModule } from './menu/menu.module';
import { LiefergebietModule } from './liefergebiet/liefergebiet.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'milano_db',
      // HIER die neuen Entities für Bestellungen eintragen, damit TypeORM die Tabellen erzeugt:
      entities: [
        KategorieEntity,
        ProduktEntity,
        ZutatEntity,
        Liefergebiet,
        Order,
        OrderPosition,
      ],
      synchronize: true, // Da das auf true steht, legt TypeORM die Tabellen jetzt sofort live an!
    }),
    TypeOrmModule.forFeature([
      KategorieEntity,
      ProduktEntity,
      ZutatEntity,
      Liefergebiet,
    ]),
    MenuModule,
    LiefergebietModule,
    OrdersModule, // <-- HIER das neue Modul registrieren, damit die API-Endpunkte aktiv sind!
  ],
  providers: [SeedService],
})
export class AppModule {}
