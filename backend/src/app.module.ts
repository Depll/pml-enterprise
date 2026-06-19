import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { KategorieEntity } from './database/entities/kategorie.entity';
import { ProduktEntity } from './database/entities/produkt.entity';
import { ZutatEntity } from './database/entities/zutat.entity';
import { Liefergebiet } from './database/entities/liefergebiet.entity'; // <-- Sicherstellen, dass das importiert ist!
import { SeedService } from './database/seeds/seed.service';
import { MenuModule } from './menu/menu.module';
import { LiefergebietModule } from './liefergebiet/liefergebiet.module'; // <-- Das neue Modul importieren!

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
      // 1. HIER die Liefergebiet-Entity in die globalen Entities eintragen:
      entities: [KategorieEntity, ProduktEntity, ZutatEntity, Liefergebiet],
      synchronize: true,
    }),
    // 2. HIER Liefergebiet in das globale forFeature-Array packen, damit der SeedService es direkt sieht:
    TypeOrmModule.forFeature([
      KategorieEntity,
      ProduktEntity,
      ZutatEntity,
      Liefergebiet,
    ]),
    MenuModule,
    LiefergebietModule, // 3. HIER das neue Modul registrieren (für den Controller/API-Endpunkt)
  ],
  providers: [SeedService],
})
export class AppModule {}
