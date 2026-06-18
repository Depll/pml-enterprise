const API_URL = 'http://localhost:3000';

export interface Zutat {
  id: number;
  name: string;
  aufpreis: number;
}

export interface Produkt {
  id: number;
  name: string;
  beschreibung: string;
  preis: number;
  aktiv: boolean;
  zutaten: Zutat[];
}

export interface Kategorie {
  id: number;
  name: string;
  label: string;
  produkte: Produkt[];
}

export const fetchMenu = async (): Promise<Kategorie[]> => {
  try {
    const response = await fetch(`${API_URL}/menu`);
    if (!response.ok) {
      throw new Error('Netzwerk-Antwort war nicht ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Fehler beim Laden der Speisekarte:', error);
    return [];
  }
};