import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KategorieEntity } from '../entities/kategorie.entity';
import { ProduktEntity } from '../entities/produkt.entity';
import { ZutatEntity } from '../entities/zutat.entity'; // Sicherstellen, dass sie importiert ist
import { Liefergebiet } from '../entities/liefergebiet.entity'; // Deine neue Entity importieren
import { SeedService } from './seed.service';

@Module({
  imports: [
    // Hier fügst du ZutatEntity und Liefergebiet hinzu
    TypeOrmModule.forFeature([
      KategorieEntity,
      ProduktEntity,
      ZutatEntity,
      Liefergebiet,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
