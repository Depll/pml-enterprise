import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  cartItemId: string; // Eindeutiger Schlüssel für DIESE spezifische Konfiguration
  id: number;
  name: string;
  preis: number;
  menge: number;
  gewaehlteZutaten?: Array<{ id: number; name: string; preis: number }>;
  entfernteZutaten?: Array<{ id: number; name: string }>;
  anmerkung?: string;

  price: number;
  quantity: number;
  selectedExtras?: Array<{ id: number; name: string; price: number }>;
  removedZutaten?: Array<{ id: number; name: string }>;
  comment?: string;

  selectedSize?: string | null;
  selectedOption?: string | null;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    produkt: { id: number; name: string; preis: number },
    extras?: Array<{ id: number; name: string; preis: number }>,
    entfernte?: Array<{ id: number; name: string }>,
    anmerkung?: string,
    selectedSize?: string | null,
    selectedOption?: string | null
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateMenge: (cartItemId: string, delta: number) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  plz: string | null;
  savePLZ: (plz: string) => boolean;
  minOrderValue: number;
  totalPrice: number;
}

const VALID_POSTCODES = ["51371", "51373", "51375", "51377", "51379", "51381"];
const MIN_ORDER_VALUE = 20.0;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pml_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [plz, setPlz] = useState<string | null>(() => {
    return localStorage.getItem('pml_user_plz');
  });

  useEffect(() => {
    localStorage.setItem('pml_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (
    produkt: { id: number; name: string; preis: number },
    extras: Array<{ id: number; name: string; preis: number }> = [],
    entfernte: Array<{ id: number; name: string }> = [],
    anmerkung: string = '',
    selectedSize: string | null = null,
    selectedOption: string | null = null
  ) => {
    setCart((prev) => {
      const existiert = prev.find(
        (item) =>
          item.id === produkt.id &&
          item.selectedSize === selectedSize &&
          item.selectedOption === selectedOption &&
          JSON.stringify(item.gewaehlteZutaten || []) === JSON.stringify(extras) &&
          JSON.stringify(item.entfernteZutaten || []) === JSON.stringify(entfernte) &&
          (item.anmerkung || '') === anmerkung
      );

      if (existiert) {
        return prev.map((item) => {
          if (item.cartItemId === existiert.cartItemId) {
            const neueMenge = item.menge + 1;
            return { ...item, menge: neueMenge, quantity: neueMenge };
          }
          return item;
        });
      }

      const aufpreisExtras = extras.reduce((sum, ext) => {
        const extraPreisWert = ext.preis !== undefined ? ext.preis : (ext as any).price;
        return sum + Number(extraPreisWert || 0);
      }, 0);
      
      const basePriceWert = Number(produkt.preis || 0);
      const endPreis = basePriceWert + aufpreisExtras;

      const generatedCartItemId = `${produkt.id}-${selectedSize || ''}-${selectedOption || ''}-${JSON.stringify(extras)}-${anmerkung}`;

      return [...prev, {
        cartItemId: generatedCartItemId,
        id: produkt.id,
        name: produkt.name,
        preis: endPreis,
        price: endPreis,
        menge: 1,
        quantity: 1,
        gewaehlteZutaten: extras,
        selectedExtras: extras.map(e => ({ id: e.id, name: e.name, price: e.preis !== undefined ? e.preis : (e as any).price })),
        entfernteZutaten: entfernte,
        removedZutaten: entfernte,
        anmerkung: anmerkung,
        comment: anmerkung,
        selectedSize: selectedSize,
        selectedOption: selectedOption
      }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateMenge = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const neueMenge = item.menge + delta;
            return { ...item, menge: neueMenge, quantity: neueMenge };
          }
          return item;
        })
        .filter((item) => item.menge > 0)
    );
  };

  const clearCart = () => setCart([]);

  const savePLZ = (inputPlz: string): boolean => {
    if (VALID_POSTCODES.includes(inputPlz)) {
      setPlz(inputPlz);
      localStorage.setItem('pml_user_plz', inputPlz);
      return true;
    }
    return false;
  };

  const totalPrice = cart.reduce((sum, item) => {
    const itemPreis = item.preis !== undefined ? item.preis : item.price;
    return sum + Number(itemPreis || 0) * Number(item.menge || 1);
  }, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateMenge, updateQuantity: updateMenge, clearCart,
      plz, savePLZ, minOrderValue: MIN_ORDER_VALUE, totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};