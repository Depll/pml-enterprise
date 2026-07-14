/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  Update,
  Start,
  Ctx,
  On,
  Message,
  Command,
} from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuService } from '../menu/menu.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserSessionEntity } from '../database/entities/user-session.entity';
import { AiOrderParserService } from './ai-order-parser.service';

const VALID_POSTCODES = ['51371', '51373', '51375', '51377', '51379', '51381'];
const PHONE_REGEX = /^[0-9+\s/-]{6,20}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-]{2,}$/;
const MIN_ORDER_VALUE = 15.0;

@Update()
export class TelegramUpdate {
  constructor(
    private readonly menuService: MenuService,
    private readonly httpService: HttpService,
    private readonly aiParserService: AiOrderParserService,
    @InjectRepository(UserSessionEntity)
    private readonly sessionRepository: Repository<UserSessionEntity>,
  ) {}

  private async getOrCreateSession(telegramChatId: string): Promise<UserSessionEntity> {
    let session = await this.sessionRepository.findOne({ where: { telegramChatId } });
    if (!session) {
      session = this.sessionRepository.create({
        telegramChatId,
        state: 'IDLE',
        tempCart: [],
        contactData: {},
        chatHistory: [],
      });
      await this.sessionRepository.save(session);
    }
    return session;
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const session = await this.getOrCreateSession(userId);
    session.state = 'IDLE';
    session.tempCart = [];
    session.contactData = {};
    session.chatHistory = [];
    await this.sessionRepository.save(session);

    await ctx.reply(
      `Willkommen beim PML Pizza Bestellbot! 🍕\n\n` +
      `Schreibe mir einfach ganz normal, was du bestellen möchtest. Tippfehler machen nichts aus!\n\n` +
      `🛵 *Lieferbedingungen:*\n` +
      `• Mindestbestellwert: *${MIN_ORDER_VALUE.toFixed(2)}€*\n` +
      `• Lieferung: *Kostenlos* (Nur Leverkusen)\n\n` +
      `💡 _Tipp: Nutze jederzeit /clear um die Bestellung zurückzusetzen._\n\n` +
      `Was darf ich dir heute Schönes zubereiten?`,
      { parse_mode: 'Markdown' }
    );
  }

  @Command(['clear', 'reset', 'restart'])
  async onClearCommand(@Ctx() ctx: Context) {
    await this.onStart(ctx);
  }

  @On('text')
  async onMessage(@Ctx() ctx: Context, @Message('text') text: string) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const session = await this.getOrCreateSession(userId);

    session.chatHistory.push({ role: 'user', content: text });
    if (session.chatHistory.length > 12) {
      session.chatHistory.shift();
    }

    await ctx.sendChatAction('typing');

    const { replyText, parsedData } = await this.aiParserService.parseUserText(
      text,
      session.tempCart,
      session.contactData,
      session.chatHistory
    );

    // parsedData explizit als beliebiges Objekt behandeln, um 'never'-Fehler zu vermeiden
    const data = parsedData as any;

    if (data) {
      if (data.userIntent === 'CANCEL_ORDER') {
        await this.onStart(ctx);
        return;
      }

      if (data.userIntent === 'CONFIRM_ORDER') {
        await this.handleFinalOrderCheckout(ctx, session);
        return;
      }

      if (data.items) {
        session.tempCart = data.items;
      }

      if (data.contact) {
        session.contactData = {
          ...session.contactData,
          ...data.contact,
        };
      }

      const validationError = this.validateSessionData(session);
      if (validationError) {
        await ctx.reply(validationError, { parse_mode: 'Markdown' });
        session.chatHistory.push({ role: 'assistant', content: validationError });
        await this.sessionRepository.save(session);
        return;
      }

      if (this.isContactDataComplete(session)) {
        await this.showOrderSummary(ctx, session);
        return;
      }
    }

    await ctx.reply(replyText);
    session.chatHistory.push({ role: 'assistant', content: replyText });
    await this.sessionRepository.save(session);
  }

  // Synchroner Validierer (Kein async/await Warnungsfehler mehr)
  private validateSessionData(session: UserSessionEntity): string | null {
    const contact = session.contactData;

    if (contact.phone && !PHONE_REGEX.test(contact.phone.trim())) {
      return `⚠️ Deine Telefonnummer *"${contact.phone}"* scheint ungültig zu sein. Bitte gib eine gültige Nummer an (nur Zahlen, Leerzeichen, / oder -).`;
    }

    if (contact.email && contact.email.toLowerCase() !== 'keine') {
      if (!EMAIL_REGEX.test(contact.email.trim())) {
        return `⚠️ Die E-Mail-Adresse *"${contact.email}"* ist ungültig. Bitte korrigiere sie oder schreibe "keine E-Mail".`;
      }
    }

    if (contact.postcode && !VALID_POSTCODES.includes(contact.postcode.trim())) {
      return `❌ Wir liefern leider nicht an die Postleitzahl *${contact.postcode}*. Wir beliefern nur folgende PLZ in Leverkusen: ${VALID_POSTCODES.join(', ')}. Bitte gib eine andere Adresse an.`;
    }

    return null;
  }

  private isContactDataComplete(session: UserSessionEntity): boolean {
    const contact = session.contactData;
    return !!(
      contact.customerName &&
      contact.street &&
      contact.houseNumber &&
      contact.postcode &&
      contact.phone
    );
  }

  private async calculateCartTotal(tempCart: any[]): Promise<{ total: number; itemsWithPrices: any[] }> {
    const menu = await this.menuService.getMenu();
    let total = 0;
    // Explizit als any[] deklariert, um den 'never'-Push-Fehler zu beheben
    const itemsWithPrices: any[] = [];

    for (const cartItem of tempCart) {
      let dbProduct: any = null;
      for (const cat of menu) {
        const p = cat.products.find((p) => p.id === cartItem.productId);
        if (p) {
          dbProduct = p;
          break;
        }
      }

      if (!dbProduct) continue;

      let itemBasePrice = Number(dbProduct.price);
      let sizeExtraIngredientPrice = 1.5;

      if (cartItem.size && dbProduct.sizes) {
        const selectedSize = dbProduct.sizes.find(
          (s: any) => s.name.toLowerCase() === cartItem.size.toLowerCase()
        );
        if (selectedSize) {
          itemBasePrice = Number(selectedSize.price);
          sizeExtraIngredientPrice = Number(selectedSize.extraIngredientPrice);
        }
      }

      let extrasTotal = 0;
      if (cartItem.extras && cartItem.extras.length > 0 && dbProduct.ingredients) {
        for (const extraName of cartItem.extras) {
          const dbIngredient = dbProduct.ingredients.find(
            (i: any) => i.name.toLowerCase() === extraName.toLowerCase()
          );
          if (dbIngredient) {
            extrasTotal += dbIngredient.extraPrice > 0 
              ? Number(dbIngredient.extraPrice) 
              : sizeExtraIngredientPrice;
          } else {
            extrasTotal += sizeExtraIngredientPrice;
          }
        }
      }

      const singleItemSum = (itemBasePrice + extrasTotal) * cartItem.quantity;
      total += singleItemSum;

      itemsWithPrices.push({
        ...cartItem,
        singlePrice: itemBasePrice + extrasTotal,
        totalPrice: singleItemSum,
      });
    }

    return { total, itemsWithPrices };
  }

  private async showOrderSummary(ctx: Context, session: UserSessionEntity) {
    const { total, itemsWithPrices } = await this.calculateCartTotal(session.tempCart);
    const contact = session.contactData;

    let summaryText = `📝 **Bitte kontrolliere deine Bestellung:**\n\n`;
    summaryText += `🛒 **Warenkorb:**\n`;

    itemsWithPrices.forEach((item, index) => {
      let details = '';
      if (item.size) details += `[${item.size}] `;
      if (item.option) details += `(${item.option}) `;

      summaryText += `*${index + 1}. ${item.name}* ${details}\n`;
      if (item.extras && item.extras.length > 0) summaryText += `   _+ Extra:_ ${item.extras.join(', ')}\n`;
      if (item.remove && item.remove.length > 0) summaryText += `   _- Ohne:_ ${item.remove.join(', ')}\n`;
      if (item.comment) summaryText += `   _Anmerkung:_ ${item.comment}\n`;
      summaryText += `   Menge: *${item.quantity}x* | Summe: *${item.totalPrice.toFixed(2)}€*\n\n`;
    });

    summaryText += `💰 **Warenwert:** *${total.toFixed(2)}€*\n`;

    if (total < MIN_ORDER_VALUE) {
      const rest = MIN_ORDER_VALUE - total;
      summaryText += `⚠️ Es fehlen noch *${rest.toFixed(2)}€* bis zum Mindestbestellwert (${MIN_ORDER_VALUE.toFixed(2)}€).\n\n`;
    } else {
      summaryText += `✅ Mindestbestellwert erreicht! Kostenlose Lieferung.\n\n`;
    }

    summaryText += `📍 **Lieferdaten:**\n`;
    summaryText += `• **Name:** ${contact.customerName}\n`;
    summaryText += `• **Adresse:** ${contact.street} ${contact.houseNumber}, ${contact.postcode} ${contact.city || 'Leverkusen'}\n`;
    summaryText += `• **Tel:** ${contact.phone}\n`;
    if (contact.email) summaryText += `• **E-Mail:** ${contact.email}\n`;
    if (contact.deliveryNote) summaryText += `• **Bote:** _"${contact.deliveryNote}"_\n`;

    summaryText += `\n--- \n`;

    if (total < MIN_ORDER_VALUE) {
      summaryText += `_Füge bitte noch ein weiteres Gericht hinzu, um bestellen zu können._`;
      await ctx.reply(summaryText, { parse_mode: 'Markdown' });
    } else {
      summaryText += `_Stimmt alles? Schreibe mir einfach **"Bestätigen"** oder **"Ja"**, um die Bestellung abzuschicken. Falls etwas falsch ist, schreibe mir einfach, was ich korrigieren soll._`;
      await ctx.reply(summaryText, { parse_mode: 'Markdown' });
    }

    session.chatHistory.push({ role: 'assistant', content: summaryText });
    await this.sessionRepository.save(session);
  }

  private async handleFinalOrderCheckout(ctx: Context, session: UserSessionEntity) {
    const contact = session.contactData;
    const { total } = await this.calculateCartTotal(session.tempCart);

    if (total < MIN_ORDER_VALUE) {
      await ctx.reply(`❌ Bestellung abgebrochen. Der Mindestbestellwert von ${MIN_ORDER_VALUE.toFixed(2)}€ wurde nicht erreicht.`);
      return;
    }

    const createOrderPayload = {
      telegramChatId: session.telegramChatId,
      customerName: contact.customerName!,
      street: contact.street!,
      houseNumber: contact.houseNumber!,
      postcode: contact.postcode!,
      city: contact.city || 'Leverkusen',
      phone: contact.phone!,
      email: contact.email === 'Keine' ? undefined : contact.email,
      deliveryNote: contact.deliveryNote === 'Keine' ? undefined : contact.deliveryNote,
      totalPrice: total,
      positions: session.tempCart.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        priceSnapshot: Number(item.singlePrice || 0),
        selectedSize: item.size || undefined,
        selectedOption: item.option || undefined,
        comment: item.comment || undefined, // Mapped jetzt sauber auf deine Spalte
        selectedIngredientsIds: [],
        removedIngredientsIds: [],
      })),
    };

    try {
      const baseUrl = process.env.BACKEND_URL || 'https://pml-enterprise-database.onrender.com';
      const apiUrl = `${baseUrl}/orders`;

      await firstValueFrom(this.httpService.post(apiUrl, createOrderPayload));

      await ctx.reply(
        `🎉 *Vielen Dank für deine Bestellung!*\n\n` +
        `Deine Bestellung wurde erfolgreich übermittelt. 🚀\n\n` +
        `⏳ *Status:* Warten auf Bestätigung...\n\n` +
        `💡 _Sobald sich der Status deiner Bestellung ändert, kriegst du hier im Chat sofort eine Live-Benachrichtigung von mir!_`,
        { parse_mode: 'Markdown' }
      );

      session.state = 'IDLE';
      session.tempCart = [];
      session.contactData = {};
      session.chatHistory = [];
      await this.sessionRepository.save(session);

    } catch (err: any) {
      console.error(
        'Fehler beim Abschicken der Bestellung an das Backend:', 
        err?.response?.data || err.message
      );
      await ctx.reply('❌ Ups! Fehler beim Übermitteln der Bestellung an den Server. Bitte versuche es später noch einmal oder rufe uns an.');
    }
  }
}