/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Update, Start, Ctx, On, Message, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuService } from '../menu/menu.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserSessionEntity } from '../database/entities/user-session.entity';
import { AiOrderParserService } from './ai-order-parser.service';
import { DialogHelperService } from './dialog-helper.service';
import { Logger } from '@nestjs/common';
import FormData from 'form-data';
import axios from 'axios';

const VALID_POSTCODES = ['51371', '51373', '51375', '51377', '51379', '51381'];
const PHONE_REGEX = /^[0-9+\s/-]{6,20}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_ORDER_VALUE = 15.0;

@Update()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    private readonly menuService: MenuService,
    private readonly httpService: HttpService,
    private readonly aiParserService: AiOrderParserService,
    private readonly dialogHelperService: DialogHelperService,
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

  @On('voice')
  async onVoiceMessage(@Ctx() ctx: Context, @Message('voice') voice: any) {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      await ctx.sendChatAction('typing');

      // 1. Hole den Download-Link von den Telegram-Servern
      const fileId = voice.file_id;
      const fileUrl = await ctx.telegram.getFileLink(fileId);

      // 2. Sende den Audio-Stream an OpenAI Whisper zur Transkription
      const transcribedText = await this.transcribeVoice(fileUrl.href);

      if (!transcribedText || transcribedText.trim().length === 0) {
        await ctx.reply('🎤 Ich habe deine Sprachnachricht empfangen, konnte aber leider kein Wort verstehen.');
        return;
      }

      // 3. User Feedback spiegeln
      await ctx.reply(`🎤 _Ich habe verstanden:_ "${transcribedText}"`, { parse_mode: 'Markdown' });

      // 4. Leite den Text nahtlos an den bestehenden Text-Handler weiter
      await this.onMessage(ctx, transcribedText);

    } catch (error) {
      this.logger.error('Fehler bei der Sprachnachrichten-Verarbeitung:', error);
      await ctx.reply('Ups, da ist ein Fehler beim Verarbeiten deiner Sprachnachricht aufgetreten. Bitte versuche es noch einmal oder tippe deine Bestellung!');
    }
  }

  @On('text')
  async onMessage(@Ctx() ctx: Context, @Message('text') text: string) {
    try {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const session = await this.getOrCreateSession(userId);
      const trimmedText = text.trim();
      const lowerText = trimmedText.toLowerCase();

      // 1. WENN EIN KONTAKT-STATE AKTIV IST
      if (session.state && session.state !== 'IDLE') {
        await this.handleContactStateMachine(ctx, session, trimmedText);
        return; 
      }

      // 2. STRIKTER CHECKOUT-TRIGGER
      if (
        (lowerText === 'ja' || lowerText === 'bestätigen' || lowerText === 'bestätige') &&
        session.tempCart && session.tempCart.length > 0 &&
        this.isContactDataComplete(session)
      ) {
        await this.handleFinalOrderCheckout(ctx, session);
        return;
      }

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

      const data = parsedData as any;

      if (data) {
        if (data.userIntent === 'CANCEL_ORDER') {
          await this.onStart(ctx);
          return;
        }

        // ABSICHERUNG DER ITEMS: Verhindert Abstürze durch unvollständige Tool-Calls bei Einwort-Dialogen
        if (data.items && Array.isArray(data.items)) {
          const validItems = data.items.map((item: any) => {
            const fallbackItem = session.tempCart && session.tempCart.length > 0 
              ? session.tempCart[session.tempCart.length - 1] 
              : null;

            return {
              productId: item.productId ? Number(item.productId) : (fallbackItem?.productId ? Number(fallbackItem.productId) : 1),
              name: item.name || (fallbackItem?.name || 'Margherita'),
              size: item.size || (fallbackItem?.size || 'Normal'),
              option: item.option || (fallbackItem?.option || null),
              extras: Array.isArray(item.extras) ? item.extras : (fallbackItem?.extras || []),
              remove: Array.isArray(item.remove) ? item.remove : (fallbackItem?.remove || []),
              quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
              comment: item.comment || (fallbackItem?.comment || null)
            };
          });
          
          session.tempCart = validItems;
        }

        // KORREKTUR-TRIGGER
        if (
          data.userIntent === 'EDITING_CONTACTS' || 
          lowerText.includes('falsch') || 
          lowerText.includes('ändern') || 
          lowerText.includes('korrigieren') ||
          lowerText.includes('korregieren')
        ) {
          if (lowerText.includes('telefon') || lowerText.includes('tel') || lowerText.includes('nummer') || lowerText.includes('handy')) {
            session.state = 'AWAITING_PHONE';
            await this.sessionRepository.save(session);
            await ctx.reply('📞 Bitte gib deine korrekte Telefonnummer ein:');
            return;
          }
          if (lowerText.includes('straße') || lowerText.includes('strasse') || lowerText.includes('adresse') || lowerText.includes('anschrift')) {
            session.state = 'AWAITING_STREET';
            await this.sessionRepository.save(session);
            await ctx.reply('🏠 Bitte gib deine korrekte Straße ein:');
            return;
          }
          if (lowerText.includes('name')) {
            session.state = 'AWAITING_NAME';
            await this.sessionRepository.save(session);
            await ctx.reply('👤 Bitte gib deinen korrekten Namen ein:');
            return;
          }
          if (lowerText.includes('plz') || lowerText.includes('postleitzahl')) {
            session.state = 'AWAITING_POSTCODE';
            await this.sessionRepository.save(session);
            await ctx.reply(`📮 Bitte gib deine korrekte Postleitzahl (PLZ) ein:`);
            return;
          }
          if (lowerText.includes('hausnummer') || lowerText.includes('nr')) {
            session.state = 'AWAITING_HOUSE_NUMBER';
            await this.sessionRepository.save(session);
            await ctx.reply('🔢 Bitte gib deine korrekte Hausnummer ein:');
            return;
          }
          if (lowerText.includes('stadt') || lowerText.includes('ort') || lowerText.includes('wohnort')) {
            session.state = 'AWAITING_CITY';
            await this.sessionRepository.save(session);
            await ctx.reply('🏙️ Bitte gib deinen korrekten Wohnort ein:');
            return;
          }
        }

        if (data.userIntent === 'CONFIRM_ORDER') {
          if (!this.isContactDataComplete(session)) {
            session.state = 'AWAITING_NAME';
            await this.sessionRepository.save(session);
            await ctx.reply('👤 Bitte gib deinen vollständigen Namen ein:');
            return;
          }
          await this.handleFinalOrderCheckout(ctx, session);
          return;
        }

        await this.sessionRepository.save(session);
      }

      let finalReply = replyText;
      
      // Ausfallsichere Generierung der Antwort und Nachfrage-Logik
      if (!finalReply || finalReply.trim().length === 0) {
        if (session.tempCart && session.tempCart.length > 0) {
          const lastItem = session.tempCart[session.tempCart.length - 1];
          const menu = await this.menuService.getMenu();

          // 1. Prüfen, ob wichtige Angaben beim letzten Produkt fehlen (Größe, Option)
          const missingSpecReply = this.dialogHelperService.generateMissingSpecificationReply(lastItem, menu);
          
          if (missingSpecReply) {
            finalReply = missingSpecReply;
          } else {
            // 2. Standard-Warenkorb-Zusammenfassung berechnen
            const { total, itemsWithPrices } = await this.calculateCartTotal(session.tempCart);
            
            // Freundliche Einleitung generieren, falls ein Kommentar vorhanden ist
            let introText = `Super, ich habe deine Bestellung aktualisiert! 🛒`;
            
            // Wenn das letzte geänderte Item einen Kommentar hat, bestätigen wir das aktiv
            if (lastItem.comment) {
              introText = `Alles klar, ich habe deine Anmerkung *"${lastItem.comment}"* für die **${lastItem.name}** gespeichert! 📝✨`;
            }

            let cartSummary = `${introText}\n\n*Dein aktueller Warenkorb:*\n`;
            itemsWithPrices.forEach(item => {
              cartSummary += `• ${item.quantity}x ${item.name} [${item.size || 'Normal'}]: ${item.totalPrice.toFixed(2)}€\n`;
              if (item.extras && item.extras.length > 0) cartSummary += `  _+ Extras:_ ${item.extras.join(', ')}\n`;
              if (item.comment) cartSummary += `  _Anmerkung:_ "${item.comment}"\n`;
            });
            cartSummary += `\n*Gesamtpreis:* ${total.toFixed(2)}€\n\nMöchtest du noch etwas hinzufügen oder die Bestellung abschließen?`;
            finalReply = cartSummary;
          }
        } else {
          // Falls der Warenkorb komplett leer ist und der User z.B. nur "bitte schneiden" schreibt:
          finalReply = 'Für welches Gericht ist der Sonderwunsch gedacht? Erzähl mir einfach, was du bestellen möchtest! 🍕';
        }
      }

      await ctx.reply(finalReply, { parse_mode: 'Markdown' });
      session.chatHistory.push({ role: 'assistant', content: finalReply });
      await this.sessionRepository.save(session);
    } catch (e) {
      this.logger.error('Kritischer Fehler im onMessage Handler:', e);
      await ctx.reply('Ups, da ist ein Fehler aufgetreten. Bitte versuche es noch einmal mit /clear!');
    }
  }

  private async handleContactStateMachine(ctx: Context, session: UserSessionEntity, trimmedText: string) {
    const saveProgress = async () => {
      await this.sessionRepository.save(session);
    };

    if (session.state === 'AWAITING_NAME') {
      if (trimmedText.length < 2) {
        await ctx.reply('⚠️ Bitte gib einen gültigen Namen ein (mindestens 2 Zeichen):');
        return;
      }
      session.contactData.customerName = trimmedText;
      if (this.isContactDataComplete(session)) {
        session.state = 'IDLE';
        await saveProgress();
        await this.showOrderSummary(ctx, session);
        return;
      }
      session.state = 'AWAITING_STREET';
      await saveProgress();
      await ctx.reply('🏠 Bitte gib deine Straße ein:');
      return;
    }

    if (session.state === 'AWAITING_STREET') {
      if (trimmedText.length < 3) {
        await ctx.reply('⚠️ Bitte gib einen gültigen Straßennamen ein:');
        return;
      }
      session.contactData.street = trimmedText;
      if (this.isContactDataComplete(session)) {
        session.state = 'IDLE';
        await saveProgress();
        await this.showOrderSummary(ctx, session);
        return;
      }
      session.state = 'AWAITING_HOUSE_NUMBER';
      await saveProgress();
      await ctx.reply('🔢 Bitte gib deine Hausnummer ein:');
      return;
    }

    if (session.state === 'AWAITING_HOUSE_NUMBER') {
      if (trimmedText.length === 0) {
        await ctx.reply('⚠️ Bitte gib eine gültige Hausnummer ein:');
        return;
      }
      session.contactData.houseNumber = trimmedText;
      if (this.isContactDataComplete(session)) {
        session.state = 'IDLE';
        await saveProgress();
        await this.showOrderSummary(ctx, session);
        return;
      }
      session.state = 'AWAITING_POSTCODE';
      await saveProgress();
      await ctx.reply(`📮 Bitte gib deine Postleitzahl (PLZ) ein (Leverkusen: ${VALID_POSTCODES.join(', ')}):`);
      return;
    }

    if (session.state === 'AWAITING_POSTCODE') {
      if (!VALID_POSTCODES.includes(trimmedText)) {
        await ctx.reply(`❌ Wir beliefern nur folgende PLZ in Leverkusen: ${VALID_POSTCODES.join(', ')}. Bitte gib eine gültige PLZ an:`);
        return;
      }
      session.contactData.postcode = trimmedText;
      if (this.isContactDataComplete(session)) {
        session.state = 'IDLE';
        await saveProgress();
        await this.showOrderSummary(ctx, session);
        return;
      }
      session.state = 'AWAITING_CITY';
      await saveProgress();
      await ctx.reply('🏙️ Bitte gib deine Stadt / Wohnort ein (z.B. Leverkusen):');
      return;
    }

    if (session.state === 'AWAITING_CITY') {
      if (trimmedText.length < 3) {
        await ctx.reply('⚠️ Bitte gib einen gültigen Wohnort an:');
        return;
      }
      session.contactData.city = trimmedText;
      if (this.isContactDataComplete(session)) {
        session.state = 'IDLE';
        await saveProgress();
        await this.showOrderSummary(ctx, session);
        return;
      }
      session.state = 'AWAITING_PHONE';
      await saveProgress();
      await ctx.reply('📞 Bitte gib deine Telefonnummer ein:');
      return;
    }

    if (session.state === 'AWAITING_PHONE') {
      if (!PHONE_REGEX.test(trimmedText)) {
        await ctx.reply('⚠️ Ungültige Telefonnummer. Bitte gib eine gültige Nummer an (nur Zahlen, Leerzeichen, / oder -):');
        return;
      }
      session.contactData.phone = trimmedText;
      if (this.isContactDataComplete(session)) {
        session.state = 'IDLE';
        await saveProgress();
        await this.showOrderSummary(ctx, session);
        return;
      }
      session.state = 'AWAITING_EMAIL';
      await saveProgress();
      await ctx.reply('📧 Bitte gib deine E-Mail-Adresse ein (oder schreibe "Keine"):');
      return;
    }

    if (session.state === 'AWAITING_EMAIL') {
      const lowerEmail = trimmedText.toLowerCase();
      if (lowerEmail !== 'keine' && !EMAIL_REGEX.test(trimmedText)) {
        await ctx.reply('⚠️ Ungültige E-Mail-Adresse. Bitte gib eine gültige E-Mail an oder schreibe "Keine":');
        return;
      }
      session.contactData.email = lowerEmail === 'keine' ? 'Keine' : trimmedText;
      if (this.isContactDataComplete(session)) {
        session.state = 'IDLE';
        await saveProgress();
        await this.showOrderSummary(ctx, session);
        return;
      }
      session.state = 'AWAITING_DELIVERY_NOTE';
      await saveProgress();
      await ctx.reply('📝 Möchtest du eine Lieferanmerkung für den Boten hinzufügen? (Oder schreibe "Keine"):');
      return;
    }

    if (session.state === 'AWAITING_DELIVERY_NOTE') {
      session.contactData.deliveryNote = trimmedText.toLowerCase() === 'keine' ? 'Keine' : trimmedText;
      session.state = 'IDLE';
      await saveProgress();
      await this.showOrderSummary(ctx, session);
      return;
    }
  }

  private isContactDataComplete(session: UserSessionEntity): boolean {
    if (!session || !session.contactData) return false;
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
    const itemsWithPrices: any[] = [];

    if (!tempCart || !Array.isArray(tempCart) || tempCart.length === 0) {
      return { total: 0, itemsWithPrices: [] };
    }

    for (const cartItem of tempCart) {
      if (!cartItem) continue;
      let dbProduct: any = null;

      // 1. Abgleich über ID (Typsicher, falls String vs. Number)
      if (Array.isArray(menu)) {
        for (const cat of menu) {
          if (!cat || !cat.products) continue;
          dbProduct = cat.products.find((p: any) => p && String(p.id) === String(cartItem.productId));
          if (dbProduct) break;
        }
      }

      // 2. Fallback über Namens-Matching
      if (!dbProduct && cartItem.name && Array.isArray(menu)) {
        const cleanCartName = String(cartItem.name).toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const cat of menu) {
          if (!cat || !cat.products) continue;
          dbProduct = cat.products.find((p: any) => {
            if (!p || !p.name) return false;
            const cleanDbName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanDbName.includes(cleanCartName) || cleanCartName.includes(cleanDbName);
          });
          if (dbProduct) break;
        }
      }

      if (!dbProduct) continue;

      let itemBasePrice = Number(dbProduct.price || 8.0);
      let sizeExtraIngredientPrice = 1.5;

      if (cartItem.size && dbProduct.sizes) {
        const selectedSize = dbProduct.sizes.find(
          (s: any) => s && s.name && String(s.name).toLowerCase().trim() === String(cartItem.size).toLowerCase().trim()
        );
        if (selectedSize) {
          itemBasePrice = Number(selectedSize.price);
          if (selectedSize.extraIngredientPrice !== undefined && selectedSize.extraIngredientPrice !== null) {
            sizeExtraIngredientPrice = Number(selectedSize.extraIngredientPrice);
          }
        }
      }

      let extrasTotal = 0;
      if (cartItem.extras && Array.isArray(cartItem.extras) && cartItem.extras.length > 0 && dbProduct.ingredients) {
        for (const extraName of cartItem.extras) {
          if (!extraName) continue;
          const dbIngredient = dbProduct.ingredients.find(
            (i: any) => i && i.name && String(i.name).toLowerCase().trim() === String(extraName).toLowerCase().trim()
          );
          
          if (dbIngredient) {
            const ingredientPrice = Number(dbIngredient.extraPrice);
            if (ingredientPrice > 0) {
              extrasTotal += ingredientPrice;
            } else {
              extrasTotal += sizeExtraIngredientPrice;
            }
          } else {
            extrasTotal += sizeExtraIngredientPrice;
          }
        }
      }

      const singlePrice = itemBasePrice + extrasTotal;
      const singleItemSum = singlePrice * (cartItem.quantity || 1);
      total += singleItemSum;

      itemsWithPrices.push({
        ...cartItem,
        name: dbProduct.name,
        singlePrice: singlePrice,
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
    if (contact.email && contact.email !== 'Keine') summaryText += `• **E-Mail:** ${contact.email}\n`;
    if (contact.deliveryNote && contact.deliveryNote !== 'Keine') summaryText += `• **Bote:** _"${contact.deliveryNote}"_\n`;

    summaryText += `\n--- \n`;

    if (total < MIN_ORDER_VALUE) {
      summaryText += `_Füge bitte noch ein weiteres Gericht hinzu, um bestellen zu können._`;
      await ctx.reply(summaryText, { parse_mode: 'Markdown' });
    } else {
      summaryText += `_Stimmt alles? Schreibe mir einfach **"Bestätigen"** oder **"Ja"**, um die Bestellung abzuschicken._`;
      await ctx.reply(summaryText, { parse_mode: 'Markdown' });
    }

    session.chatHistory = [{ role: 'assistant', content: summaryText }];
    await this.sessionRepository.save(session);
  }

  private async handleFinalOrderCheckout(ctx: Context, session: UserSessionEntity) {
    const contact = session.contactData;
    const { total, itemsWithPrices } = await this.calculateCartTotal(session.tempCart);

    if (total < MIN_ORDER_VALUE) {
      await ctx.reply(`❌ Bestellung abgebrochen. Der Mindestbestellwert von ${MIN_ORDER_VALUE.toFixed(2)}€ wurde nicht erreicht.`);
      return;
    }

    const processingMsg = await ctx.reply('⏳ Deine Bestellung wird an die Küche übermittelt... Bitte warte einen kurzen Moment.');

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
      positions: itemsWithPrices.map((item) => {
        const convertedId = Number(item.productId);
        return {
          productId: isNaN(convertedId) ? 1 : convertedId,
          quantity: Number(item.quantity || 1),
          priceSnapshot: Number(item.singlePrice || 0),
          selectedSize: item.size || undefined,
          selectedOption: item.option || undefined,
          comment: item.comment || undefined,
          selectedIngredientsIds: [],
          removedIngredientsIds: [],
        };
      }),
    };

    try {
      const baseUrl = process.env.BACKEND_URL || 'https://pml-enterprise-database.onrender.com';
      const apiUrl = `${baseUrl}/orders`;

      await firstValueFrom(this.httpService.post(apiUrl, createOrderPayload));

      try {
        await ctx.telegram.deleteMessage(ctx.chat!.id, processingMsg.message_id);
      } catch {
        // Ignoriert
      }

      await ctx.reply(
        `🎉 *Vielen Dank für deine Bestellung!*\n\n` +
        `Deine Bestellung wurde erfolgreich übermittelt. 🚀\n\n` +
        `⏳ *Status:* Warten auf Bestätigung durch das Restaurant...\n\n` +
        `💡 _Sobald die Küche deine Bestellung bearbeitet, erhältst du hier sofort eine Benachrichtigung!_`,
        { parse_mode: 'Markdown' }
      );

      session.state = 'IDLE';
      session.tempCart = [];
      session.contactData = {};
      session.chatHistory = [];
      await this.sessionRepository.save(session);

    } catch (err: any) {
      this.logger.error('Fehler beim Abschicken der Bestellung an das Backend:', err?.response?.data || err.message);
      
      await ctx.reply(
        `❌ *Fehler bei der Übermittlung!*\n\n` +
        `Der Server konnte die Bestellung nicht verarbeiten. Bitte versuche es in wenigen Minuten erneut oder wende dich direkt an uns.\n` +
        `_Details: ${err?.response?.data?.message || err.message || 'Unknown Error'}_`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  private async transcribeVoice(fileUrl: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY ist in den Umgebungsvariablen nicht gesetzt!');
    }

    const response = await axios.get(fileUrl, { responseType: 'stream' });

    const formData = new FormData();
    formData.append('file', response.data, 'voice.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'de');

    const whisperResponse = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return whisperResponse.data.text;
  }
}