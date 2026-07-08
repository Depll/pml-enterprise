import { Update, Start, Ctx, Action, On, Message } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { MenuService } from '../menu/menu.service';

interface CallbackQueryData {
  data: string;
}

interface SimpleProduct {
  id: number;
  name: string;
  price: string | number;
  description?: string | null;
  isActive?: boolean;
}

// Mögliche Schritte für den Bestellprozess
enum OrderStep {
  NONE,
  WAITING_FOR_ADDRESS,
  WAITING_FOR_PLZ,
  WAITING_FOR_NAME,
  WAITING_FOR_PHONE,
}

// Struktur, um die eingegebenen Bestelldaten zwischenzuspeichern
interface TemporaryOrder {
  step: OrderStep;
  address?: string;
  plz?: string;
  name?: string;
  phone?: string;
}

@Update()
export class TelegramUpdate {
  // Warenkörbe: { [userId: number]: { [productId: number]: number } }
  private carts: Record<number, Record<number, number>> = {};

  // Bestell-Zustände: { [userId: number]: TemporaryOrder }
  private orderStates: Record<number, TemporaryOrder> = {};

  constructor(private readonly menuService: MenuService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    try {
      const menu = await this.menuService.getMenu();
      const categoryButtons = menu.map((category) => {
        return Markup.button.callback(
          category.name,
          `show_category_${category.id}`,
        );
      });

      await ctx.reply(
        'Willkommen beim PML Pizza Bestellbot! 🍕\n\nWas möchtest du heute bestellen? Wähle eine Kategorie:',
        Markup.inlineKeyboard(categoryButtons, { columns: 2 }),
      );
    } catch (error) {
      console.error('Fehler im Telegram Bot:', error);
      await ctx.reply('Ups, da ist etwas schiefgelaufen.');
    }
  }

  @Action(/^show_category_(\d+)$/)
  async onCategorySelect(@Ctx() ctx: Context) {
    try {
      const callbackQuery = ctx.callbackQuery as CallbackQueryData;
      if (!callbackQuery || !callbackQuery.data) return;

      const match = callbackQuery.data.match(/^show_category_(\d+)$/);
      if (!match) return;

      const categoryId = Number(match[1]);
      const menu = await this.menuService.getMenu();
      const selectedCategory = menu.find((cat) => cat.id === categoryId);

      if (!selectedCategory) {
        await ctx.reply('Kategorie wurde nicht gefunden.');
        return;
      }

      if (
        !selectedCategory.products ||
        selectedCategory.products.length === 0
      ) {
        await ctx.reply(
          `In der Kategorie "${selectedCategory.name}" gibt es aktuell keine Gerichte.`,
        );
        return;
      }

      await ctx.reply(
        `Hier sind die Gerichte aus der Kategorie *${selectedCategory.name}*:`,
        { parse_mode: 'Markdown' },
      );

      const userId = ctx.from?.id;

      for (const product of selectedCategory.products) {
        if (product.isActive === false) continue;

        const currentCount =
          (userId && this.carts[userId] && this.carts[userId][product.id]) || 0;

        let infoText = `*${product.name}*\n${product.description ?? ''}\nPreis: ${Number(product.price).toFixed(2)}€`;
        if (currentCount > 0) {
          infoText += `\n\n_Aktuell ${currentCount}x im Warenkorb_`;
        }

        const buttons: any[][] = [];
        if (currentCount > 0) {
          buttons.push([
            Markup.button.callback('➖', `remove_${product.id}`),
            Markup.button.callback(`${currentCount}x`, `noop`),
            Markup.button.callback('➕', `add_${product.id}`),
          ]);
        } else {
          buttons.push([
            Markup.button.callback('🛒 In den Warenkorb', `add_${product.id}`),
          ]);
        }
        buttons.push([
          Markup.button.callback('🛍️ Warenkorb anzeigen', 'show_cart'),
        ]);

        await ctx.reply(infoText, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons),
        });
      }

      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Fehler beim Laden der Produkte:', error);
      await ctx.reply('Fehler beim Laden der Gerichte.');
    }
  }

  @Action(/^add_(\d+)$/)
  async handleAddProduct(@Ctx() ctx: Context) {
    await this.updateProductQuantity(ctx, 1);
  }

  @Action(/^remove_(\d+)$/)
  async handleRemoveProduct(@Ctx() ctx: Context) {
    await this.updateProductQuantity(ctx, -1);
  }

  @Action('noop')
  async handleNoop(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
  }

  private async updateProductQuantity(ctx: Context, change: number) {
    try {
      const callbackQuery = ctx.callbackQuery as CallbackQueryData;
      if (!callbackQuery || !callbackQuery.data) return;

      const match = callbackQuery.data.match(/^(?:add|remove)_(\d+)$/);
      if (!match) return;

      const productId = Number(match[1]);
      const userId = ctx.from?.id;
      if (!userId) return;

      const menu = await this.menuService.getMenu();
      let foundProduct: SimpleProduct | null = null;
      for (const cat of menu) {
        const prod = cat.products.find((p) => p.id === productId);
        if (prod) {
          foundProduct = prod;
          break;
        }
      }
      if (!foundProduct) return;

      if (!this.carts[userId]) this.carts[userId] = {};
      const currentCount = this.carts[userId][productId] || 0;
      const newCount = currentCount + change;

      if (newCount <= 0) {
        delete this.carts[userId][productId];
      } else {
        this.carts[userId][productId] = newCount;
      }

      const finalCount = this.carts[userId][productId] || 0;

      let infoText = `*${foundProduct.name}*\n${foundProduct.description ?? ''}\nPreis: ${Number(foundProduct.price).toFixed(2)}€`;
      if (finalCount > 0) {
        infoText += `\n\n_Aktuell ${finalCount}x im Warenkorb_`;
      }

      const buttons: any[][] = [];
      if (finalCount > 0) {
        buttons.push([
          Markup.button.callback('➖', `remove_${foundProduct.id}`),
          Markup.button.callback(`${finalCount}x`, `noop`),
          Markup.button.callback('➕', `add_${foundProduct.id}`),
        ]);
      } else {
        buttons.push([
          Markup.button.callback(
            '🛒 In den Warenkorb',
            `add_${foundProduct.id}`,
          ),
        ]);
      }
      buttons.push([
        Markup.button.callback('🛍️ Warenkorb anzeigen', 'show_cart'),
      ]);

      await ctx.editMessageText(infoText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      });

      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Fehler beim Ändern der Menge:', err);
    }
  }

  @Action('show_cart')
  async onShowCart(@Ctx() ctx: Context) {
    try {
      const userId = ctx.from?.id;

      if (
        !userId ||
        !this.carts[userId] ||
        Object.keys(this.carts[userId]).length === 0
      ) {
        await ctx.reply('Dein Warenkorb ist aktuell noch leer. 🛒');
        await ctx.answerCbQuery();
        return;
      }

      const menu = await this.menuService.getMenu();
      let total = 0;
      let cartText = '🛍️ *Dein aktueller Warenkorb:*\n\n';

      for (const [prodIdStr, quantity] of Object.entries(this.carts[userId])) {
        const productId = Number(prodIdStr);
        let currentProduct: SimpleProduct | null = null;

        for (const cat of menu) {
          const prod = cat.products.find((p) => p.id === productId);
          if (prod) {
            currentProduct = prod;
            break;
          }
        }

        if (currentProduct) {
          const itemPrice = Number(currentProduct.price);
          const sumPrice = itemPrice * quantity;
          total += sumPrice;

          cartText += `• *${currentProduct.name}* (${quantity}x) - ${sumPrice.toFixed(2)}€\n`;
        }
      }

      cartText += `\n💰 *Gesamtsumme: ${total.toFixed(2)}€*`;

      const cartButtons = Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Jetzt bestellen', 'checkout')],
        [Markup.button.callback('🍕 Weiter einkaufen', 'continue_shopping')],
      ]);

      await ctx.reply(cartText, { parse_mode: 'Markdown', ...cartButtons });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Fehler beim Anzeigen des Warenkorbs:', error);
      await ctx.reply('Fehler beim Laden des Warenkorbs.');
    }
  }

  @Action('continue_shopping')
  async onContinueShopping(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this.onStart(ctx);
  }

  @Action('checkout')
  async onCheckout(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    this.orderStates[userId] = { step: OrderStep.WAITING_FOR_ADDRESS };

    await ctx.reply(
      '🏠 Bitte gib deine *Lieferadresse* ein (Straße und Hausnummer):',
      { parse_mode: 'Markdown' },
    );
    await ctx.answerCbQuery();
  }

  @On('message')
  async onMessage(@Ctx() ctx: Context, @Message('text') text: string) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const userState = this.orderStates[userId];

    if (!userState || userState.step === OrderStep.NONE) {
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_ADDRESS) {
      userState.address = text;
      userState.step = OrderStep.WAITING_FOR_PLZ;
      await ctx.reply(
        '📮 Perfekt. Bitte gib jetzt deine *Postleitzahl (PLZ)* ein:',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_PLZ) {
      userState.plz = text;
      userState.step = OrderStep.WAITING_FOR_NAME;
      await ctx.reply('👤 Wie ist dein *Name*?', { parse_mode: 'Markdown' });
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_NAME) {
      userState.name = text;
      userState.step = OrderStep.WAITING_FOR_PHONE;
      await ctx.reply(
        '📞 Bitte gib als Letztes deine *Telefonnummer* für eventuelle Rückfragen ein:',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_PHONE) {
      userState.phone = text;
      userState.step = OrderStep.NONE;

      const summary =
        `📋 *Zusammenfassung deiner Daten:*\n\n` +
        `👤 Name: ${userState.name}\n` +
        `🏠 Adresse: ${userState.address}\n` +
        `📮 PLZ: ${userState.plz}\n` +
        `📞 Telefon: ${userState.phone}\n\n` +
        `Stimmen diese Daten?`;

      const confirmButtons = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '✅ Ja, Bestellung abschicken',
            'confirm_order',
          ),
        ],
        [Markup.button.callback('❌ Abbrechen', 'cancel_order')],
      ]);

      await ctx.reply(summary, { parse_mode: 'Markdown', ...confirmButtons });
    }
  }
}
