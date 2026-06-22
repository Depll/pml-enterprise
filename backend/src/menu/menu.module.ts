import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KategorieEntity } from '../database/entities/kategorie.entity';
import { ProduktEntity } from '../database/entities/produkt.entity';
import { ZutatEntity } from '../database/entities/zutat.entity'; // <-- NEU: Import der ZutatEntity
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KategorieEntity, ProduktEntity, ZutatEntity]),
  ], // <-- NEU: ZutatEntity hier ergänzt
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
