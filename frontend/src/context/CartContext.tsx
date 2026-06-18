import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  preis: number;
  menge: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (produkt: { id: number; name: string; preis: unknown }) => void;
  removeFromCart: (id: number) => void;
  updateMenge: (id: number, delta: number) => void;
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

  const addToCart = (produkt: { id: number; name: string; preis: unknown }) => {
    setCart((prev) => {
      const existiert = prev.find((item) => item.id === produkt.id);
      if (existiert) {
        return prev.map((item) =>
          item.id === produkt.id ? { ...item, menge: item.menge + 1 } : item
        );
      }
      return [...prev, { id: produkt.id, name: produkt.name, preis: Number(produkt.preis), menge: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateMenge = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, menge: item.menge + delta } : item))
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
      cart, addToCart, removeFromCart, updateMenge, clearCart,
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