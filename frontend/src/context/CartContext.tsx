import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  
  // Alte deutsche Felder (für Abwärtskompatibilität im Frontend)
  preis: number;
  menge: number;
  gewaehlteZutaten?: Array<{ id: number; name: string; preis: number }>;
  entfernteZutaten?: Array<{ id: number; name: string }>;
  anmerkung?: string;

  // NEUE englische Felder (Mappen direkt auf die Werte, um TS-Fehler im Drawer zu killen)
  price: number;
  quantity: number;
  selectedExtras?: Array<{ id: number; name: string; price: number }>;
  removedZutaten?: Array<{ id: number; name: string }>;
  comment?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    produkt: { id: number; name: string; preis: number }, 
    extras?: Array<{ id: number; name: string; preis: number }>,
    entfernte?: Array<{ id: number; name: string }>,
    anmerkung?: string
  ) => void;
  removeFromCart: (id: number) => void;
  updateMenge: (id: number, delta: number) => void;
  updateQuantity: (id: number, delta: number) => void; // NEU: Alias für die englische Version
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
    anmerkung: string = ''
  ) => {
    setCart((prev) => {
      const existiert = prev.find(
        (item) => 
          item.id === produkt.id && 
          JSON.stringify(item.gewaehlteZutaten || []) === JSON.stringify(extras) &&
          JSON.stringify(item.entfernteZutaten || []) === JSON.stringify(entfernte) &&
          (item.anmerkung || '') === anmerkung
      );

      if (existiert) {
        return prev.map((item) => {
          if (
            item.id === produkt.id && 
            JSON.stringify(item.gewaehlteZutaten || []) === JSON.stringify(extras) &&
            JSON.stringify(item.entfernteZutaten || []) === JSON.stringify(entfernte) &&
            (item.anmerkung || '') === anmerkung
          ) {
            const neueMenge = item.menge + 1;
            return { 
              ...item, 
              menge: neueMenge, 
              quantity: neueMenge // Synchronisiert englischen Key
            };
          }
          return item;
        });
      }

      const aufpreisExtras = extras.reduce((sum, ext) => sum + ext.preis, 0);
      const endPreis = produkt.preis + aufpreisExtras;

      // Neues Item befüllt sowohl deutsche als auch englische Keys vollautomatisch
      return [...prev, { 
        id: produkt.id, 
        name: produkt.name, 
        preis: endPreis, 
        price: endPreis,
        menge: 1, 
        quantity: 1,
        gewaehlteZutaten: extras,
        selectedExtras: extras.map(e => ({ id: e.id, name: e.name, price: e.preis })),
        entfernteZutaten: entfernte,
        removedZutaten: entfernte,
        anmerkung: anmerkung,
        comment: anmerkung
      }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateMenge = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
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

  const totalPrice = cart.reduce((sum, item) => sum + item.preis * item.menge, 0);

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