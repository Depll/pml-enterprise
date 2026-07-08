import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update';

@Module({
  providers: [TelegramUpdate],
})
export class TelegramModule {}
