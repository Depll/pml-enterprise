import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';
import { IngredientEntity } from '../entities/ingredient.entity'; // Sicherstellen, dass sie importiert ist
import { DeliveryAreaEntity } from '../entities/delivery-area.entity'; // Deine neue Entity importieren
import { SeedService } from './seed.service';

@Module({
  imports: [
    // Hier fügst du ZutatEntity und Liefergebiet hinzu
    TypeOrmModule.forFeature([
      CategoryEntity,
      ProductEntity,
      IngredientEntity,
      DeliveryAreaEntity,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
