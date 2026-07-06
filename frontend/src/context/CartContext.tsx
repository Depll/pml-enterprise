import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  cartItemId: string;
  id: number;
  name: string;
  price: number;
  quantity: number;
  selectedIngredients?: Array<{ id: number; name: string; price: number }>;
  selectedExtras?: Array<{ id: number; name: string; price: number }>;
  comment?: string;
  removedIngredients?: Array<{ id: number; name: string }>;
  selectedSize?: string | null;
  selectedOption?: string | null;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: { id: number; name: string; price: number },
    extras?: Array<{ id: number; name: string; price: number }>,
    removed?: Array<{ id: number; name: string }>,
    comment?: string,
    selectedSize?: string | null,
    selectedOption?: string | null
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  postcode: string | null;
  savePostcode: (postcode: string) => boolean;
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

  const [postcode, setPostcode] = useState<string | null>(() => {
    return localStorage.getItem('pml_user_postcode') || localStorage.getItem('pml_user_plz');
  });

  useEffect(() => {
    localStorage.setItem('pml_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (
    product: { id: number; name: string; price: number },
    extras: Array<{ id: number; name: string; price: number }> = [],
    removed: Array<{ id: number; name: string }> = [],
    comment: string = '',
    selectedSize: string | null = null,
    selectedOption: string | null = null
  ) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedOption === selectedOption &&
          JSON.stringify(getSelectedIngredients(item)) === JSON.stringify(extras) &&
          JSON.stringify(getRemovedIngredients(item)) === JSON.stringify(removed) &&
          getComment(item) === comment
      );

      if (existingItem) {
        return prev.map((item) => {
          if (item.cartItemId === existingItem.cartItemId) {
            const newQuantity = getQuantity(item) + 1;
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
      }

      const extrasSurcharge = extras.reduce((sum, ext) => {
        return sum + Number(ext.price || 0);
      }, 0);
      
      const basePriceValue = Number(product.price || 0);
      const finalPrice = basePriceValue + extrasSurcharge;

      const generatedCartItemId = `${product.id}-${selectedSize || ''}-${selectedOption || ''}-${JSON.stringify(extras)}-${comment}`;

      return [...prev, {
        cartItemId: generatedCartItemId,
        id: product.id,
        name: product.name,
        price: finalPrice,
        quantity: 1,
        selectedIngredients: extras,
        selectedExtras: extras,
        removedIngredients: removed,
        comment: comment,
        selectedSize: selectedSize,
        selectedOption: selectedOption
      }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQuantity = getQuantity(item) + delta;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => getQuantity(item) > 0)
    );
  };

  const clearCart = () => setCart([]);

  const savePostcode = (inputPostcode: string): boolean => {
    if (VALID_POSTCODES.includes(inputPostcode)) {
      setPostcode(inputPostcode);
      localStorage.setItem('pml_user_postcode', inputPostcode);
      return true;
    }
    return false;
  };

  const totalPrice = cart.reduce((sum, item) => {
    return sum + getPrice(item) * getQuantity(item);
  }, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      postcode, savePostcode, minOrderValue: MIN_ORDER_VALUE, totalPrice
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

const getPrice = (item: CartItem) => Number(item.price ?? (item as any).preis ?? 0);

const getQuantity = (item: CartItem) => Number(item.quantity ?? (item as any).menge ?? 1);

const getComment = (item: CartItem) => String(item.comment ?? (item as any).anmerkung ?? '');

const getSelectedIngredients = (item: CartItem) =>
  item.selectedIngredients ?? item.selectedExtras ?? (item as any).gewaehlteZutaten ?? [];

const getRemovedIngredients = (item: CartItem) =>
  item.removedIngredients ?? (item as any).removedZutaten ?? (item as any).entfernteZutaten ?? [];
