/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { MenuService } from '../menu/menu.service';
import { OpenAI } from 'openai';

@Injectable()
export class AiOrderParserService {
  private readonly logger = new Logger(AiOrderParserService.name);
  private openai: OpenAI;

  constructor(private readonly menuService: MenuService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async parseUserText(
    userText: string,
    currentCart: any[],
    currentContact: any,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) {
    try {
      const menu = await this.menuService.getMenu();
      const simplifiedMenu = menu.map(cat => ({
        category: cat.name,
        products: cat.products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          basePrice: p.price,
          sizes: p.sizes || null, 
          options: p.options || null, 
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          availableExtras: (p as any).ingredients ? (p as any).ingredients.map((i: any) => ({
            name: i.name
          })) : []
        }))
      }));

      const systemPrompt = `Du bist der automatisierte Bestell-Assistent für die Pizzeria PML.
Antworte IMMER auf Deutsch und verwende unter KEINEN UMSTÄNDEN generische Sätze oder leere Antworten.

Hier ist das DB-Menü (Hinweis: Extras haben hier absichtlich keine Preise, da diese dynamisch berechnet werden!):
${JSON.stringify(simplifiedMenu, null, 2)}

Hier ist der AKTUELLE WARENKORB auf dem Server:
${JSON.stringify(currentCart, null, 2)}

⚠️ ABSOLUTES VERBOT FÜR FALSCHE EXTRAPREISE:
Nenne im Chat NIEMALS statische Preise wie 1,00 € für Extras wie Tomatensauce oder Mozzarella! Die Preise für Extras existieren NUR gekoppelt an die gewählte Pizza-Größe!

⚠️ STRIKTE MATHEMATISCHE REGEL FÜR PIZZA-EXTRA-PREISE:
Jede Pizza-Größe hat einen eigenen 'extraIngredientPrice' in der DB:
- Größe 'Normal' -> Jedes Extra kostet exakt 1.50 € pro Pizza.
- Größe 'XXL' -> Jedes Extra kostet exakt 2.00 € pro Pizza.
- Größe 'Partyblech' -> Jedes Extra kostet exakt 4.00 € pro Pizza.

⚠️ BERECHNUNGSREGEL (EXTRAS WERDEN MIT DER MENGE MULTIPLIZIERT):
Wenn ein Kunde 2x eine Pizza XXL bestellt, gilt das Extra für BEIDE Pizzen.
Beispiel für "2x Margherita XXL mit Extra Mozzarella":
- Basispreis Margherita XXL: 12.00 €
- Extra-Preis Mozzarella (bei XXL): 2.00 € pro Pizza
- Rechnung pro Pizza: 12.00 € + 2.00 € = 14.00 €
- Gesamtsumme: 2x 14.00 € = 28.00 € (NICHT 26.00 €!)
Berechne das im Text IMMER exakt so! Multipliziere den Extra-Aufpreis immer mit der Anzahl ('quantity') der Pizzen!

⚠️ STRIKTES ANTWORTFORMAT (KEINE ABWEICHUNG ERLAUBT):
Deine Textantwort MUSS exakt so strukturiert sein, sobald Artikel im Korb liegen:

"Super, ich habe deine Bestellung aktualisiert! 🛒

Dein aktueller Warenkorb:
• [Menge]x [Produktname] [[Größe]]: [Tatsächlicher Preis inklusive Extras multipliziert mit Menge]€
  * Extras: [NUR einblenden, wenn wirklich Extras ausgewählt sind, z.B. Mozzarella, ansonsten diese Zeile komplett weglassen!]

Gesamtpreis: [Gesamtsumme aller Produkte inklusive aller multiplizierten Extras]€

[NUR WENN DAS GERADE BEARBEITETE ODER ZULETZT HINZUGEFÜGTE PRODUKT EINE PIZZA/NUDELN IST]:
Für deine [Produktname] [[Größe]] kannst du folgende Extras hinzufügen:
[Liste aller verfügbaren Extras aus 'availableExtras' mit dem exakten 'extraIngredientPrice' der gewählten Größe, z. B. "• Mozzarella: 2,00 €" bei XXL]

Möchtest du eines dieser Extras hinzufügen oder die Bestellung abschließen?

[NUR WENN DAS GERADE BEARBEITETE ODER ZULETZT HINZUGEFÜGTE PRODUKT EIN GETRÄNK IST]:
Möchtest du noch etwas hinzufügen oder die Bestellung abschließen?"

FÜHRE BEI JEDER ÄNDERUNG DEN TOOL-CALL 'sync_order_data' AUS!`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userText }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.1, 
        tools: [
          {
            type: 'function',
            function: {
              name: 'sync_order_data',
              description: 'Synchronisiert den aktuellen Warenkorb und die Lieferdaten basierend auf der Nutzereingabe.',
              parameters: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    description: 'Liste aller Artikel, die der Nutzer aktuell im Warenkorb haben möchte.',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'number', description: 'Die ID des Produkts aus dem bereitgestellten Menü.' },
                        name: { type: 'string', description: 'Der exakte Name des Produkts.' },
                        size: { type: 'string', description: "NUR für Pizzen: 'Normal', 'XXL' oder 'Partyblech'" },
                        option: { type: 'string', description: "NUR für Salate (Dressing) oder Nudeln (Nudelsorte)" },
                        extras: { type: 'array', items: { type: 'string' }, description: 'Zutaten, die extra hinzugefügt werden sollen.' },
                        remove: { type: 'array', items: { type: 'string' }, description: 'Zutaten, die entfernt werden sollen.' },
                        quantity: { type: 'number', default: 1 },
                        comment: { type: 'string', description: 'Sonderwünsche speziell für DIESEN Artikel (z.B. "kalt", "geschnitten", "ohne Zwiebeln").' }
                      },
                      required: ['productId', 'name', 'quantity']
                    }
                  },
                  delivery_note: { type: 'string', description: 'Sonderwünsche direkt an die Küche.' },
                  userIntent: { type: 'string', enum: ['ADDING_ITEMS', 'EDITING_CONTACTS', 'CONFIRM_ORDER', 'CANCEL_ORDER'] }
                },
              },
            },
          },
        ],
      });

      const assistantMessage = response.choices[0].message;
      let parsedData = null;

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0] as any;
        if (toolCall.function && toolCall.function.name === 'sync_order_data') {
          parsedData = JSON.parse(toolCall.function.arguments);
        }
      }

      return {
        replyText: assistantMessage.content || '',
        parsedData: parsedData
      };
    } catch (error) {
      this.logger.error('Fehler beim Aufruf der OpenAI API:', error);
      return {
        replyText: '',
        parsedData: null,
      };
    }
  }
}