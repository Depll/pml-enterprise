import { Update, Start, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class TelegramUpdate {
  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      'Willkommen beim PML Pizza Bestellbot! 🍕 Was möchtest du heute bestellen?',
    );
  }
}
