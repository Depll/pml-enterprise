import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // <-- Hier importiert
import { TelegramUpdate } from './telegram.update';
import { MenuModule } from '../menu/menu.module';

@Module({
  imports: [
    HttpModule, // <-- MUSS hier im imports-Array stehen!
    MenuModule,
  ],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
