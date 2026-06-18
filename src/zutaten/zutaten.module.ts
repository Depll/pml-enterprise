import { Module } from '@nestjs/common';
import { ZutatenController } from './zutaten.controller';
import { ZutatenService } from './zutaten.service';

@Module({
  controllers: [ZutatenController],
  providers: [ZutatenService]
})
export class ZutatenModule {}
