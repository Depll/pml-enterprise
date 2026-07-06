const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface Ingredient {
  id: number;
  name: string;
  extraPrice: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  sizes: Array<{
    name: string;
    price: number;
    extraIngredientPrice: number;
  }> | null;
  options: string[] | null;
  category_id: number;
  ingredients: Ingredient[];
}

export interface Category {
  id: number;
  name: string;
  label: string;
  products: Product[];
}

export const fetchMenu = async (): Promise<Category[]> => {
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