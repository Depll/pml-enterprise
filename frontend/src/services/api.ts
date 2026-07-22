import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERFACES ---
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
  isActive: boolean;
  sizes: Array<{ name: string; price: number; extraIngredientPrice: number }> | null;
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

// --- CENTRAL API SERVICES ---
export const apiService = {
  // ==========================================
  // GETTERS (READ)
  // ==========================================
  fetchMenu: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<Category[]>('/menu');
      const data = Array.isArray(response.data) ? response.data : [];

      // Hier mappen wir das 'is_active' aus der DB auf das 'isActive' für React
      return data.map((category: any) => ({
        ...category,
        products: (category.products || []).map((product: any) => ({
          ...product,
          isActive: product.is_active ?? product.isActive ?? true, // Fallback, falls es schon angepasst war
        })),
      }));
    } catch (error) {
      console.error('Failed fetching menu structure:', error);
      return [];
    }
  },

  fetchOrdersSafe: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/orders');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed fetching orders:', error);
      return [];
    }
  },

  // ==========================================
  // MUTATIONS (ORDERS)
  // ==========================================
  updateOrderStatus: async (orderId: string, status: string, stornoReason?: string): Promise<boolean> => {
    try {
      const response = await apiClient.patch(`/orders/${orderId}/status`, { status, stornoReason });
      return response.status === 200 || response.status === 204;
    } catch (error) {
      console.error('Network error during status transition:', error);
      return false;
    }
  },

  // ==========================================
  // MUTATIONS (MENU & PRODUCTS)
  // ==========================================
  addProduct: async (payload: Record<string, unknown>): Promise<any> => {
    // Hier werfen wir den Fehler absichtlich weiter (throw), damit die Komponente
    // die spezifische Server-Fehlermeldung (z.B. Validierungsfehler) im alert() anzeigen kann!
    try {
      const response = await apiClient.post('/menu', payload);
      return response.data;
    } catch (error: any) {
      console.error('Failed creating product:', error);
      throw error.response?.data || error;
    }
  },

  updateProduct: async (id: number, updatedData: Partial<Product>): Promise<boolean> => {
    try {
      const response = await apiClient.patch(`/menu/${id}`, updatedData);
      return response.status === 200;
    } catch (error) {
      console.error('Failed mutating menu product entries:', error);
      return false;
    }
  },

  deleteProduct: async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`/menu/${id}`);
      return response.status === 200;
    } catch (error) {
      console.error('Deletion query failed on core product resource:', error);
      return false;
    }
  },

  // ==========================================
  // MUTATIONS (INGREDIENTS)
  // ==========================================
  addIngredient: async (productId: number, name: string, price: number): Promise<boolean> => {
    try {
      const response = await apiClient.post(`/menu/${productId}/ingredient`, { name, price });
      return response.status === 201 || response.status === 200;
    } catch (error) {
      console.error('Failed appending new ingredient dependency:', error);
      return false;
    }
  },

  updateIngredient: async (id: number, updatedData: { name?: string; extraPrice?: number }): Promise<boolean> => {
    try {
      const response = await apiClient.patch(`/menu/ingredient/${id}`, updatedData);
      return response.status === 200;
    } catch (error) {
      console.error('Failed modifying target extra asset:', error);
      return false;
    }
  },

  deleteIngredient: async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`/menu/ingredient/${id}`);
      return response.status === 200;
    } catch (error) {
      console.error('Deletion error on target extra asset:', error);
      return false;
    }
  },

  createOrder: async (payload: Record<string, unknown>): Promise<any> => {
    try {
      const response = await apiClient.post('/orders', payload);
      return response.data; // Gibt die erstellte Bestellung (inkl. ID) zurück
    } catch (error: any) {
      console.error('Zentraler API-Fehler beim Erstellen der Bestellung:', error);
      // Wir werfen den genauen Server-Fehler weiter
      throw error.response?.data || error;
    }
  },

  checkPostcode: async (postcode: string): Promise<{ erlaubt: boolean; allowed?: boolean }> => {
    try {
      const response = await apiClient.get(`/api/delivery-areas/check/${postcode}`);
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Postleitzahlen-Prüfung:', error);
      throw error;
    }
  },

  // ==========================================
  // MUTATIONS / CHECKS (VOUCHERS)
  // ==========================================
  validateVoucher: async (code: string, currentCartTotal: number): Promise<{ valid: boolean; code: string; discountAmount: number }> => {
    try {
      const response = await apiClient.post('/vouchers/validate', {
        code,
        currentCartTotal,
      });
      return response.data;
    } catch (error: any) {
      console.error('Fehler bei der Gutschein-Validierung:', error);
      throw error.response?.data || error;
    }
  },

};