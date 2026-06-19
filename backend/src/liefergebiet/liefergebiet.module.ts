import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liefergebiet } from '../database/entities/liefergebiet.entity';
import { LiefergebietService } from './liefergebiet.service';
import { LiefergebietController } from './liefergebiet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Liefergebiet])],
  controllers: [LiefergebietController],
  providers: [LiefergebietService],
  exports: [LiefergebietService], // Falls du es später woanders brauchst
})
export class LiefergebietModule {}
