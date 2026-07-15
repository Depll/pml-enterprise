/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

interface CartItem {
  productId: number;
  name: string;
  size?: string;
  option?: string;
  extras?: string[];
  remove?: string[];
  quantity: number;
  comment?: string;
}

@Injectable()
export class DialogHelperService {
  /**
   * Generiert eine dynamische Antwort für den Kunden, falls die KI-Antwort leer sein sollte.
   * Prüft anhand der Produktkategorie, was wirklich im Warenkorb fehlt.
   */
  generateMissingSpecificationReply(lastItem: CartItem, menu: any[]): string {
    let isPizza = false;
    let hasOptions = false;

    for (const cat of menu) {
      const p = cat.products.find((prod: any) => prod.id === lastItem.productId);
      if (p) {
        const catName = cat.name.toLowerCase();
        isPizza = catName.includes('pizza');
        hasOptions = catName.includes('salat') || catName.includes('nudel');
        break;
      }
    }

    if (isPizza && !lastItem.size) {
      return `Für deine **${lastItem.name}** benötige ich noch die Größe. Möchtest du sie in **Normal**, **XXL** oder **Partyblech**? 🍕`;
    }

    if (hasOptions && !lastItem.option) {
      return `Für deine **${lastItem.name}** benötige ich noch die gewünschte Option (z.B. Nudelsorte oder Dressing). Was darf es sein?`;
    }

    if (!lastItem.extras || lastItem.extras.length === 0) {
      const details = lastItem.size ? ` (${lastItem.size})` : lastItem.option ? ` (${lastItem.option})` : '';
      return (
        `Alles klar, **${lastItem.quantity}x ${lastItem.name}${details}** ist im Warenkorb! 🍕\n\n` +
        `Möchtest du noch leckere **Extras** hinzufügen, Zutaten **abwählen** oder hast du einen **Sonderwunsch** für die Küche?`
      );
    }

    return `Ich habe deine Bestellung aktualisiert! Möchtest du noch etwas hinzufügen oder die Bestellung abschließen?`;
  }
}