import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { KategorieEntity } from './database/entities/kategorie.entity';
import { ProduktEntity } from './database/entities/produkt.entity';
import { ZutatEntity } from './database/entities/zutat.entity'; // <-- Importieren!
import { SeedService } from './database/seeds/seed.service'; // <-- Importieren!
import { MenuModule } from './menu/menu.module';

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
      // WICHTIG: Füge ZutatEntity hier in das Array ein:
      entities: [KategorieEntity, ProduktEntity, ZutatEntity], 
      synchronize: true,
    }),
    // Für den Seeder müssen wir die Entities auch "forFeature" bereitstellen
    TypeOrmModule.forFeature([KategorieEntity, ProduktEntity, ZutatEntity]),
    MenuModule,
  ],
  providers: [SeedService], // <-- Den SeedService hier eintragen!
})
export class AppModule {}
