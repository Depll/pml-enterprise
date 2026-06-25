import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../database/entities/category.entity';
import { ProductEntity } from '../database/entities/product.entity';
import { IngredientEntity } from '../database/entities/ingredient.entity';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity, ProductEntity, IngredientEntity]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
