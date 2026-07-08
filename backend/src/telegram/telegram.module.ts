import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update';
import { MenuModule } from '../menu/menu.module'; // <-- Import-Pfad zum Menu

@Module({
  imports: [MenuModule], // <-- Verknüpft das MenuModule mit dem Bot
  providers: [TelegramUpdate],
})
export class TelegramModule {}
