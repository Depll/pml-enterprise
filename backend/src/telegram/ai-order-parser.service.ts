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
      // 1. Lade das aktuelle Menü aus deiner DB als Kontext für die KI
      const menu = await this.menuService.getMenu();
      const simplifiedMenu = menu.map(cat => ({
        category: cat.name,
        products: cat.products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          basePrice: p.price,
          sizes: p.sizes ? p.sizes.map(s => s.name) : null,
          options: p.options
        }))
      }));

      // 2. Erstelle den System-Prompt für absolute Präzision
      const systemPrompt = `Du bist ein automatischer Bestell-Assistent für eine Pizzeria namens PML. 
Deine Aufgabe ist es, den Text des Nutzers zu verstehen und den aktuellen Warenkorb sowie die Kontaktdaten über das Tool 'sync_order_data' zu aktualisieren.

Hier ist unser aktuelles Menü aus der Datenbank:
${JSON.stringify(simplifiedMenu, null, 2)}

Regeln:
- Wenn der Nutzer ein Gericht nennt (z.B. Margherita), ordne es dem korrekten Produkt aus dem Menü zu.
- Für Pizzen muss eine Größe vorhanden sein ('Normal', 'XXL', 'Partyblech'). Wenn keine genannt wurde, frage im Antworttext danach.
- Für Nudeln ('Spaghetti', 'Rigatoni'...) oder Salate ('Joghurt-Dressing'...) muss eine Option/Dressing gewählt sein.
- Verstehe Sonderwünsche wie "extra Knoblauch" oder "ohne Zwiebeln" und trage sie bei 'extras' oder 'remove' ein.
- Allgemeine Küchenanmerkungen (z.B. "bitte extra knusprig") kommen in 'kitchenNote'.
- Wenn der Nutzer Adressdaten, Namen oder Telefonnummern nennt, extrahiere sie für das 'contact'-Objekt.
- Antworte immer freundlich und auf Deutsch im ganz normalen Text-Output.`;

      // 3. Bereite die Nachrichten inklusive Historie vor
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userText }
      ];

      // 4. Definiere das Tool für strukturiertes JSON-Output (sync_order_data)
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.2,
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
                        size: { type: 'string', description: "Pflichtfeld für Pizza: 'Normal', 'XXL' oder 'Partyblech'" },
                        option: { type: 'string', description: "Pflichtfeld für Salate (Dressing) oder Nudeln (Nudelsorte)" },
                        extras: { type: 'array', items: { type: 'string' }, description: 'Zutaten, die extra hinzugefügt werden sollen.' },
                        remove: { type: 'array', items: { type: 'string' }, description: 'Zutaten, die entfernt werden sollen.' },
                        quantity: { type: 'number', default: 1 }
                      },
                      required: ['productId', 'name', 'quantity']
                    }
                  },
                  kitchenNote: { type: 'string', description: 'Sonderwünsche direkt an die Küche.' },
                  contact: {
                    type: 'object',
                    properties: {
                      customerName: { type: 'string' },
                      street: { type: 'string' },
                      houseNumber: { type: 'string' },
                      postcode: { type: 'string' },
                      city: { type: 'string' },
                      phone: { type: 'string' },
                      email: { type: 'string' },
                      deliveryNote: { type: 'string', description: 'Anmerkung für den Lieferanten (z.B. Hinterhaus)' }
                    },
                  },
                  userIntent: { type: 'string', enum: ['ADDING_ITEMS', 'EDITING_CONTACTS', 'CONFIRM_ORDER', 'CANCEL_ORDER'] }
                },
              },
            },
          },
        ],
      });

      const assistantMessage = response.choices[0].message;
      let parsedData = null;

      // Prüfen, ob die KI das Tool aufgerufen hat, um Daten zu ändern
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0] as any; // Cast auf any, um Typen-Konflikt zu lösen
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
        replyText:
          'Es gab ein Problem bei der Verarbeitung deiner Nachricht. Bitte versuche es gleich noch einmal.',
        parsedData: null,
      };
    }
  }
}
