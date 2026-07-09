/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  Update,
  Start,
  Ctx,
  Action,
  On,
  Message,
  Command,
} from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { MenuService } from '../menu/menu.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CallbackQueryData {
  data: string;
}

enum OrderStep {
  NONE,
  WAITING_FOR_SIZE,
  WAITING_FOR_OPTION,
  WAITING_FOR_REMARK,
  // Checkout-Schritte passend zum CreateOrderDto
  WAITING_FOR_NAME,
  WAITING_FOR_STREET,
  WAITING_FOR_HOUSE_NUMBER,
  WAITING_FOR_POSTCODE,
  WAITING_FOR_CITY,
  WAITING_FOR_PHONE,
  WAITING_FOR_EMAIL,
  WAITING_FOR_DELIVERY_NOTE,
}

interface CartItem {
  productId: number;
  name: string;
  size?: string;
  option?: string;
  remark: string;
  price: number;
  quantity: number;
}

interface UserState {
  step: OrderStep;
  currentProductId?: number;
  currentSize?: string;
  currentOption?: string;
  configuredPrice?: number;
  // Checkout-Daten
  customerName?: string;
  street?: string;
  houseNumber?: string;
  postcode?: string;
  city?: string;
  phone?: string;
  email?: string;
  deliveryNote?: string;
}

// Validierungs-Konstanten aus deinem React-Frontend & DTO
const VALID_POSTCODES = ['51371', '51373', '51375', '51377', '51379', '51381'];
const PHONE_REGEX = /^[0-9+\s/-]{6,20}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-]{2,}$/;

// Mindestbestellwert definieren
const MIN_ORDER_VALUE = 15.0;

@Update()
export class TelegramUpdate {
  private carts: Record<number, CartItem[]> = {};
  private userStates: Record<number, UserState> = {};

  constructor(
    private readonly menuService: MenuService,
    private readonly httpService: HttpService,
  ) {}

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

      // Optischer Hinweis auf den Mindestbestellwert direkt in der Start-Nachricht
      await ctx.reply(
        `Willkommen beim PML Pizza Bestellbot! 🍕\n\n` +
        `🛵 *Lieferbedingungen:*\n` +
      `• Mindestbestellwert: *${MIN_ORDER_VALUE.toFixed(2)}€*\n` +
        `• Lieferung: *Kostenlos* (Nur Leverkusen)\n\n` +
        `💡 _Tipp: Nutze jederzeit /clear um die Bestellung zurückzusetzen._\n\n` +
        `Was möchtest du heute bestellen? Wähle eine Kategorie:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(categoryButtons, { columns: 2 })
        }
      );
    } catch (error) {
      console.error('Fehler im Telegram Bot:', error);
      await ctx.reply('Ups, da ist etwas schiefgelaufen.');
    }
  }

  // Clear / Reset Kommando für den sauberen Neustart
  @Command(['clear', 'reset', 'restart'])
  async onClearCommand(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (userId) {
      delete this.carts[userId];
      this.userStates[userId] = { step: OrderStep.NONE };
    }
    
    await ctx.reply('🔄 *Dein Warenkorb und deine Eingaben wurden zurückgesetzt!*', { parse_mode: 'Markdown' });
    await this.onStart(ctx);
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

      if (!selectedCategory.products || selectedCategory.products.length === 0) {
        await ctx.reply(`In der Kategorie "${selectedCategory.name}" gibt es aktuell keine Gerichte.`);
        return;
      }

      await ctx.reply(`Hier sind die Gerichte aus der Kategorie *${selectedCategory.name}*:`, { parse_mode: 'Markdown' });

      for (const product of selectedCategory.products) {
        if (product.isActive === false) continue;

        const infoText = `*${product.name}*\n${product.description ?? ''}\nBasispreis: ${Number(product.price).toFixed(2)}€`;
        const productButton = Markup.inlineKeyboard([
          [Markup.button.callback('🛒 In den Warenkorb', `configure_${product.id}`)],
          [Markup.button.callback('🛍️ Warenkorb anzeigen', 'show_cart')]
        ]);

        await ctx.reply(infoText, { parse_mode: 'Markdown', ...productButton });
      }
      await ctx.answerCbQuery();
    } catch (error) {
      console.error(error);
    }
  }

  @Action(/^configure_(\d+)$/)
  async onConfigureProduct(@Ctx() ctx: Context) {
    try {
      const callbackQuery = ctx.callbackQuery as CallbackQueryData;
      if (!callbackQuery || !callbackQuery.data) return;

      const match = callbackQuery.data.match(/^configure_(\d+)$/);
      if (!match) return;

      const productId = Number(match[1]);
      const userId = ctx.from?.id;
      if (!userId) return;

      const menu = await this.menuService.getMenu();
      let product: any = null;
      for (const cat of menu) {
        const p = cat.products.find((p) => p.id === productId);
        if (p) { product = p; break; }
      }

      if (!product) return;

      this.userStates[userId] = {
        ...this.userStates[userId],
        step: OrderStep.NONE,
        currentProductId: productId,
        configuredPrice: Number(product.price)
      };

      if (product.sizes && product.sizes.length > 0) {
        this.userStates[userId].step = OrderStep.WAITING_FOR_SIZE;
        const sizeButtons = product.sizes.map((s: any, idx: number) => [
          Markup.button.callback(`${s.name} (${Number(s.price).toFixed(2)}€)`, `select_size_${idx}`)
        ]);
        await ctx.reply('📐 Bitte wähle eine *Größe* für dein Gericht:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(sizeButtons) });
        await ctx.answerCbQuery();
        return;
      }

      if (product.options && product.options.length > 0) {
        await this.promptForOptions(ctx, product.options);
        await ctx.answerCbQuery();
        return;
      }

      await this.promptForRemark(ctx);
      await ctx.answerCbQuery();
    } catch (error) {
      console.error(error);
    }
  }

  @Action(/^select_size_(\d+)$/)
  async onSizeSelect(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQueryData;
    const sizeIdx = Number(callbackQuery.data.split('_')[2]);
    const userId = ctx.from?.id;
    if (!userId || !this.userStates[userId]) return;

    const state = this.userStates[userId];
    const menu = await this.menuService.getMenu();
    let product: any = null;
    for (const cat of menu) {
      const p = cat.products.find((p) => p.id === state.currentProductId);
      if (p) { product = p; break; }
    }

    const selectedSize = product?.sizes?.[sizeIdx];
    if (!selectedSize) return;

    state.currentSize = selectedSize.name;
    state.configuredPrice = Number(selectedSize.price);

    if (product.options && product.options.length > 0) {
      await this.promptForOptions(ctx, product.options);
    } else {
      await this.promptForRemark(ctx);
    }
    await ctx.answerCbQuery();
  }

  @Action(/^select_option_(\d+)$/)
  async onOptionSelect(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQueryData;
    const optionIdx = Number(callbackQuery.data.split('_')[2]);
    const userId = ctx.from?.id;
    if (!userId || !this.userStates[userId]) return;

    const state = this.userStates[userId];
    const menu = await this.menuService.getMenu();
    let product: any = null;
    for (const cat of menu) {
      const p = cat.products.find((p) => p.id === state.currentProductId);
      if (p) { product = p; break; }
    }

    const selectedOption = product?.options?.[optionIdx];
    if (!selectedOption) return;

    state.currentOption = selectedOption;
    await this.promptForRemark(ctx);
    await ctx.answerCbQuery();
  }

  private async promptForOptions(ctx: Context, options: string[]) {
    const userId = ctx.from?.id;
    if (!userId) return;
    this.userStates[userId].step = OrderStep.WAITING_FOR_OPTION;
    const optionButtons = options.map((opt, idx) => [Markup.button.callback(opt, `select_option_${idx}`)]);
    await ctx.reply('🍝 Bitte wähle eine *Option / Variante*:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(optionButtons) });
  }

  private async promptForRemark(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;
    this.userStates[userId].step = OrderStep.WAITING_FOR_REMARK;
    const skipButton = Markup.inlineKeyboard([[Markup.button.callback('⏩ Keine Anmerkung (Überspringen)', 'skip_remark')]]);
    await ctx.reply(`✍️ Möchtest du eine *Anmerkung* hinzufügen?\n\nKlicke auf Überspringen oder tippe sie als Text ein:`, { parse_mode: 'Markdown', ...skipButton });
  }

  @Action('skip_remark')
  async onSkipRemark(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this.addProductToCartFinal(ctx, 'Keine');
  }

  private async addProductToCartFinal(ctx: Context, remarkText: string) {
    const userId = ctx.from?.id;
    if (!userId || !this.userStates[userId]) return;

    const state = this.userStates[userId];
    const menu = await this.menuService.getMenu();
    let baseProduct: any = null;
    for (const cat of menu) {
      const prod = cat.products.find((p) => p.id === state.currentProductId);
      if (prod) { baseProduct = prod; break; }
    }
    if (!baseProduct) return;

    if (!this.carts[userId]) this.carts[userId] = [];
    const existingItem = this.carts[userId].find(
      (item) => item.productId === state.currentProductId && item.size === state.currentSize && item.option === state.currentOption && item.remark === remarkText
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.carts[userId].push({
        productId: baseProduct.id,
        name: baseProduct.name,
        size: state.currentSize,
        option: state.currentOption,
        remark: remarkText,
        price: state.configuredPrice!,
        quantity: 1
      });
    }

    state.step = OrderStep.NONE;
    const basketButton = Markup.inlineKeyboard([
      [Markup.button.callback('🛍️ Warenkorb anzeigen', 'show_cart')],
      [Markup.button.callback('🍕 Weiter einkaufen', 'continue_shopping')]
    ]);

    let confirmationMsg = `✅ *${baseProduct.name}* wurde hinzugefügt!\n`;
    if (state.currentSize) confirmationMsg += `📐 Größe: *${state.currentSize}*\n`;
    if (state.currentOption) confirmationMsg += `🍝 Variante: *${state.currentOption}*\n`;
    confirmationMsg += `✍️ Anmerkung: _${remarkText}_\n\nWas möchtest du tun?`;

    await ctx.reply(confirmationMsg, { parse_mode: 'Markdown', ...basketButton });
  }

  @Action('show_cart')
  async onShowCart(@Ctx() ctx: Context) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      if (!this.carts[userId] || this.carts[userId].length === 0) {
        const emptyButtons = Markup.inlineKeyboard([[Markup.button.callback('🍕 Jetzt einkaufen', 'continue_shopping')]]);
        try { await ctx.editMessageText('Dein Warenkorb ist aktuell noch leer. 🛒', { ...emptyButtons }); } catch { await ctx.reply('Dein Warenkorb ist aktuell noch leer. 🛒', { ...emptyButtons }); }
        await ctx.answerCbQuery();
        return;
      }

      let total = 0;
      let cartText = '🛍️ *Dein aktueller Warenkorb:*\n\n';
      const inlineButtons: any[][] = [];

      this.carts[userId].forEach((item, index) => {
        const sumPrice = item.price * item.quantity;
        total += sumPrice;
        let details = '';
        if (item.size) details += `[${item.size}] `;
        if (item.option) details += `(${item.option}) `;

        cartText += `*${index + 1}. ${item.name}* ${details}\n`;
        if (item.remark !== 'Keine') cartText += `   _Anmerkung: ${item.remark}_\n`;
        cartText += `   Menge: *${item.quantity}x* | Summe: *${sumPrice.toFixed(2)}€*\n\n`;

        inlineButtons.push([
          Markup.button.callback(`➖`, `cart_minus_${index}`),
          Markup.button.callback(`${index + 1}. ${item.quantity}x`, `noop`),
          Markup.button.callback(`➕`, `cart_plus_${index}`)
        ]);
      });

      cartText += `💰 *Gesamtsumme: ${total.toFixed(2)}€*\n`;
      
      if (total < MIN_ORDER_VALUE) {
        const rest = MIN_ORDER_VALUE - total;
        cartText += `⚠️ Es fehlen noch *${rest.toFixed(2)}€* bis zum Mindestbestellwert (${MIN_ORDER_VALUE.toFixed(2)}€).`;
      } else {
        cartText += `✅ Mindestbestellwert erreicht! Kostenlose Lieferung.`;
      }

      inlineButtons.push([Markup.button.callback('🚀 Jetzt bestellen', 'checkout')]);
      inlineButtons.push([Markup.button.callback('🍕 Weiter einkaufen', 'continue_shopping')]);

      try { await ctx.editMessageText(cartText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(inlineButtons) }); } catch { await ctx.reply(cartText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(inlineButtons) }); }
      await ctx.answerCbQuery();
    } catch (error) {
      console.error(error);
    }
  }

  @Action(/^cart_plus_(\d+)$/)
  async onCartPlus(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQueryData;
    const index = Number(callbackQuery.data.split('_')[2]);
    const userId = ctx.from?.id;
    if (userId && this.carts[userId] && this.carts[userId][index]) {
      this.carts[userId][index].quantity += 1;
      await this.onShowCart(ctx);
    }
  }

  @Action(/^cart_minus_(\d+)$/)
  async onCartMinus(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQueryData;
    const index = Number(callbackQuery.data.split('_')[2]);
    const userId = ctx.from?.id;
    if (userId && this.carts[userId] && this.carts[userId][index]) {
      this.carts[userId][index].quantity -= 1;
      if (this.carts[userId][index].quantity <= 0)
        this.carts[userId].splice(index, 1);
      await this.onShowCart(ctx);
    }
  }

  @Action('noop') async handleNoop(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
  }
  @Action('continue_shopping') async onContinueShopping(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this.onStart(ctx);
  }

  @Action('checkout')
  async onCheckout(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const cart = this.carts[userId] || [];
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (total < MIN_ORDER_VALUE) {
      const rest = MIN_ORDER_VALUE - total;
      await ctx.reply(
        `❌ *Bestellung nicht möglich!*\n\n` +
        `Deine Gesamtsumme beträgt aktuell *${total.toFixed(2)}€*.\n` +
        `Du musst Produkte im Wert von mindestens *${MIN_ORDER_VALUE.toFixed(2)}€* hinzufügen, um bestellen zu können (es fehlen noch ${rest.toFixed(2)}€).`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🛍️ Zum Warenkorb', 'show_cart')],
            [Markup.button.callback('🍕 Weiter einkaufen', 'continue_shopping')]
          ])
        }
      );
      await ctx.answerCbQuery();
      return;
    }

    this.userStates[userId] = { ...this.userStates[userId], step: OrderStep.WAITING_FOR_NAME };
    await ctx.reply('👤 Bitte gib deinen *vollständigen Namen* ein:', { parse_mode: 'Markdown' });
    await ctx.answerCbQuery();
  }

  @Action(/^edit_(.+)$/)
  async onEditField(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery as CallbackQueryData;
    const field = callbackQuery.data.replace('edit_', '');
    const userId = ctx.from?.id;
    if (!userId || !this.userStates[userId]) return;

    const state = this.userStates[userId];
    
    if (field === 'customerName') { state.step = OrderStep.WAITING_FOR_NAME; await ctx.reply('👤 Gib den neuen *Namen* ein:'); }
    else if (field === 'street') { state.step = OrderStep.WAITING_FOR_STREET; await ctx.reply('🏠 Gib die neue *Straße* ein:'); }
    else if (field === 'houseNumber') { state.step = OrderStep.WAITING_FOR_HOUSE_NUMBER; await ctx.reply('🔢 Gib die neue *Hausnummer* ein:'); }
    else if (field === 'postcode') { state.step = OrderStep.WAITING_FOR_POSTCODE; await ctx.reply('📮 Gib die neue *Postleitzahl* aus Leverkusen ein:'); }
    else if (field === 'city') { state.step = OrderStep.WAITING_FOR_CITY; await ctx.reply('🏙️ Gib die neue *Stadt* ein:'); }
    else if (field === 'phone') { state.step = OrderStep.WAITING_FOR_PHONE; await ctx.reply('📞 Gib die neue *Telefonnummer* ein:'); }
    else if (field === 'email') { state.step = OrderStep.WAITING_FOR_EMAIL; await ctx.reply('📧 Gib die neue *E-Mail-Adresse* ein (oder "Keine"):'); }
    else if (field === 'deliveryNote') { state.step = OrderStep.WAITING_FOR_DELIVERY_NOTE; await ctx.reply('📝 Gib die neue *Lieferanmerkung* ein (oder "Keine"):'); }

    await ctx.answerCbQuery();
  }

  private async showOrderSummary(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || !this.userStates[userId]) return;

    const state = this.userStates[userId];

    const summaryText = `📋 *Prüfe deine Bestelldaten:*\n\n` +
      `👤 Name: ${state.customerName}\n` +
      `🏠 Straße: ${state.street}\n` +
      `🔢 Hausnummer: ${state.houseNumber}\n` +
      `📮 PLZ: ${state.postcode} (Leverkusen)\n` +
      `🏙️ Stadt: ${state.city || 'Leverkusen'}\n` +
      `📞 Telefon: ${state.phone}\n` +
      `📧 E-Mail: ${state.email ?? 'Keine'}\n` +
      `📝 Lieferanmerkung: ${state.deliveryNote ?? 'Keine'}\n\n` +
      `Falls ein Fehler vorliegt, klicke auf einen Button, um das Feld gezielt zu korrigieren.`;

    const summaryButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✏️ Name', 'edit_customerName'),
        Markup.button.callback('✏️ Straße', 'edit_street'),
      ],
      [
        Markup.button.callback('✏️ Hausnr.', 'edit_houseNumber'),
        Markup.button.callback('✏️ PLZ', 'edit_postcode'),
      ],
      [
        Markup.button.callback('✏️ Stadt', 'edit_city'),
        Markup.button.callback('✏️ Telefon', 'edit_phone'),
      ],
      [
        Markup.button.callback('✏️ E-Mail', 'edit_email'),
        Markup.button.callback('✏️ Anmerkung', 'edit_deliveryNote'),
      ],
      [Markup.button.callback('✅ JETZT BESTELLEN', 'confirm_order')],
      [Markup.button.callback('❌ Abbrechen', 'cancel_order')],
    ]);

    await ctx.reply(summaryText, { parse_mode: 'Markdown', ...summaryButtons });
  }

  @Action('confirm_order')
  async onConfirmOrder(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || !this.userStates[userId]) return;

    const state = this.userStates[userId];
    const cart = this.carts[userId];

    if (!cart || cart.length === 0) {
      await ctx.reply('Dein Warenkorb ist leer.');
      return;
    }

    const totalOrderPrice = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (totalOrderPrice < MIN_ORDER_VALUE) {
      await ctx.reply(
        `❌ Bestellung abgebrochen. Der Mindestbestellwert von ${MIN_ORDER_VALUE.toFixed(2)}€ wurde unterschritten.`,
      );
      await ctx.answerCbQuery();
      return;
    }

    const createOrderPayload = {
      telegramChatId: userId.toString(),
      customerName: state.customerName!,
      street: state.street!,
      houseNumber: state.houseNumber!,
      postcode: state.postcode!,
      city: state.city || 'Leverkusen',
      phone: state.phone!,
      email: state.email === 'Keine' ? undefined : state.email,
      deliveryNote:
        state.deliveryNote === 'Keine' ? undefined : state.deliveryNote,
      totalPrice: totalOrderPrice,
      positions: cart.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        priceSnapshot: Number(item.price),
        selectedSize: item.size || undefined,
        selectedOption: item.option || undefined,
        comment: item.remark === 'Keine' ? undefined : item.remark,
        selectedIngredientsIds: [],
        removedIngredientsIds: [],
      })),
    };

    try {
      const baseUrl =
        process.env.BACKEND_URL ||
        'https://pml-enterprise-database.onrender.com';
      const apiUrl = `${baseUrl}/orders`;

      await firstValueFrom(this.httpService.post(apiUrl, createOrderPayload));

      // GEÄNDERT: Zeigt das dedizierte Live-Tracking-Fenster an, anstatt das Startmenü neu zu laden
      await ctx.editMessageText(
        `🎉 *Vielen Dank für deine Bestellung!*\n\n` +
        `Deine Bestellung wurde erfolgreich übermittelt. 🚀\n\n` +
        `⏳ *Status:* Warten auf Bestätigung...\n\n` +
        `💡 _Du musst nichts weiter tun. Sobald sich der Status deiner Bestellung ändert, kriegst du hier im Chat sofort eine Live-Benachrichtigung von mir!_`,
        { parse_mode: 'Markdown' },
      );

      delete this.carts[userId];
      this.userStates[userId] = { step: OrderStep.NONE };

    } catch (err: any) {
      console.error(
        'Fehler beim Abschicken der Bestellung an das Backend:', 
        err?.response?.data || err.message
      );
      await ctx.reply('❌ Ups! Fehler beim Übermitteln der Bestellung an den Server. Bitte versuche es später noch einmal oder rufe uns an.');
    }
    await ctx.answerCbQuery();
  }

  @Action('cancel_order')
  async onCancelOrder(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (userId) this.userStates[userId] = { step: OrderStep.NONE };

    await ctx.editMessageText(
      '❌ Die Bestellung wurde abgebrochen und das Eingabefenster geschlossen.',
    );
    await ctx.answerCbQuery();

    await this.onStart(ctx);
  }

  @On('message')
  async onMessage(@Ctx() ctx: Context, @Message('text') text: string) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const userState = this.userStates[userId];
    if (!userState || userState.step === OrderStep.NONE) return;

    if (userState.step === OrderStep.WAITING_FOR_REMARK) {
      await this.addProductToCartFinal(ctx, text);
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_NAME) {
      const nameClean = text.trim();
      if (nameClean.length < 2 || nameClean.length > 150) {
        await ctx.reply(
          '⚠️ Der Name muss zwischen 2 und 150 Zeichen lang sein. Bitte erneut eingeben:',
        );
        return;
      }
      userState.customerName = nameClean;
      if (!userState.street) {
        userState.step = OrderStep.WAITING_FOR_STREET;
        await ctx.reply('🏠 Bitte gib deine *Straße* ein:', {
          parse_mode: 'Markdown',
        });
      } else {
        userState.step = OrderStep.NONE;
        await this.showOrderSummary(ctx);
      }
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_STREET) {
      userState.street = text.trim();
      if (!userState.houseNumber) {
        userState.step = OrderStep.WAITING_FOR_HOUSE_NUMBER;
        await ctx.reply('🔢 Bitte gib deine *Hausnummer* ein:', {
          parse_mode: 'Markdown',
        });
      } else {
        userState.step = OrderStep.NONE;
        await this.showOrderSummary(ctx);
      }
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_HOUSE_NUMBER) {
      userState.houseNumber = text.trim();
      if (!userState.postcode) {
        userState.step = OrderStep.WAITING_FOR_POSTCODE;
        await ctx.reply('📮 Bitte gib deine *Postleitzahl (PLZ)* ein:', {
          parse_mode: 'Markdown',
        });
      } else {
        userState.step = OrderStep.NONE;
        await this.showOrderSummary(ctx);
      }
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_POSTCODE) {
      const plzInput = text.trim();
      if (!VALID_POSTCODES.includes(plzInput)) {
        await ctx.reply('❌ Wir liefern leider nicht an diese Postleitzahl. Bitte gib eine gültige PLZ aus Leverkusen ein (51371, 51373, 51375, 51377, 51379, 51381):');
        return;
      }
      userState.postcode = plzInput;
      if (!userState.city) { 
        userState.step = OrderStep.WAITING_FOR_CITY; 
        await ctx.reply('🏙️ Bitte gib deine *Stadt / Wohnort* ein:', { parse_mode: 'Markdown' }); 
      } else { 
        userState.step = OrderStep.NONE; 
        await this.showOrderSummary(ctx); 
      }
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_CITY) {
      userState.city = text.trim();
      if (!userState.phone) { 
        userState.step = OrderStep.WAITING_FOR_PHONE; 
        await ctx.reply('📞 Bitte gib deine *Telefonnummer* ein:', { parse_mode: 'Markdown' }); 
      } else { 
        userState.step = OrderStep.NONE; 
        await this.showOrderSummary(ctx); 
      }
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_PHONE) {
      const phoneClean = text.trim();
      if (!PHONE_REGEX.test(phoneClean)) {
        await ctx.reply('⚠️ Ungültige Telefonnummer! Bitte nutze nur Zahlen, Leerzeichen, / oder - (6 bis 20 Zeichen):');
        return;
      }
      userState.phone = phoneClean;
      if (userState.email === undefined) { 
        userState.step = OrderStep.WAITING_FOR_EMAIL; 
        await ctx.reply('📧 Bitte gib deine *E-Mail-Adresse* ein (oder schreibe "Keine"):', { parse_mode: 'Markdown' }); 
      } else { 
        userState.step = OrderStep.NONE; 
        await this.showOrderSummary(ctx); 
      }
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_EMAIL) {
      const emailInput = text.trim();
      if (emailInput.toLowerCase() !== 'keine') {
        if (!EMAIL_REGEX.test(emailInput)) {
          await ctx.reply('⚠️ Bitte gib eine gültige E-Mail-Adresse ein (oder schreibe "Keine"):');
          return;
        }
        userState.email = emailInput;
      } else {
        userState.email = 'Keine';
      }

      if (userState.deliveryNote === undefined) { 
        userState.step = OrderStep.WAITING_FOR_DELIVERY_NOTE; 
        await ctx.reply('📝 Möchtest du eine *Lieferanmerkung* hinzufügen? (Oder schreibe "Keine"):', { parse_mode: 'Markdown' }); 
      } else { 
        userState.step = OrderStep.NONE; 
        await this.showOrderSummary(ctx); 
      }
      return;
    }

    if (userState.step === OrderStep.WAITING_FOR_DELIVERY_NOTE) {
      userState.deliveryNote = text.trim();
      userState.step = OrderStep.NONE;
      await this.showOrderSummary(ctx);
    }
  }
}