import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, CartItem } from './types';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotalInr: number;
  taxInr: number;
  serviceChargeInr: number;
  discountInr: number;
  discountCode: string;
  totalInr: number;
  addItem: (item: MenuItem, quantity?: number, notes?: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  applyDiscountCode: (code: string) => { success: boolean; message: string; discountPercent?: number };
  removeDiscountCode: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nivora_cart_v2';
const DISCOUNT_STORAGE_KEY = 'nivora_cart_discount_v2';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(CART_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [discountCode, setDiscountCode] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(DISCOUNT_STORAGE_KEY) || '';
      }
    } catch {
      // fallback
    }
    return '';
  });

  const [discountPercent, setDiscountPercent] = useState<number>(() => {
    return discountCode.toUpperCase() === 'NIVORA10' ? 10 : discountCode.toUpperCase() === 'ROYAL20' ? 20 : 0;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DISCOUNT_STORAGE_KEY, discountCode);
      }
    } catch {}
  }, [discountCode]);

  const addItem = (item: MenuItem, quantity = 1, notes = '') => {
    if (!item.is_available) return;
    setItems((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
          special_notes: notes || next[existingIndex].special_notes,
        };
        return next;
      } else {
        return [...prev, { item, quantity, special_notes: notes }];
      }
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((ci) => (ci.item.id === menuItemId ? { ...ci, quantity } : ci))
    );
  };

  const removeItem = (menuItemId: string) => {
    setItems((prev) => prev.filter((ci) => ci.item.id !== menuItemId));
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode('');
    setDiscountPercent(0);
  };

  const applyDiscountCode = (code: string) => {
    const cleaned = code.trim().toUpperCase();
    if (cleaned === 'NIVORA10') {
      setDiscountCode('NIVORA10');
      setDiscountPercent(10);
      return { success: true, message: 'Privilege Member 10% discount applied!', discountPercent: 10 };
    }
    if (cleaned === 'ROYAL20') {
      setDiscountCode('ROYAL20');
      setDiscountPercent(20);
      return { success: true, message: 'Royal Sovereign 20% discount applied!', discountPercent: 20 };
    }
    return { success: false, message: 'Invalid or expired promotional code. Try NIVORA10' };
  };

  const removeDiscountCode = () => {
    setDiscountCode('');
    setDiscountPercent(0);
  };

  const itemCount = items.reduce((sum, ci) => sum + ci.quantity, 0);
  const subtotalInr = items.reduce((sum, ci) => sum + ci.item.price_inr * ci.quantity, 0);
  const discountInr = Math.round((subtotalInr * discountPercent) / 100);
  const discountedSubtotal = Math.max(0, subtotalInr - discountInr);
  
  // Luxury resort standard taxes: 5% GST and 5% hospitality service charge
  const taxInr = Math.round(discountedSubtotal * 0.05);
  const serviceChargeInr = Math.round(discountedSubtotal * 0.05);
  const totalInr = discountedSubtotal + taxInr + serviceChargeInr;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalInr,
        taxInr,
        serviceChargeInr,
        discountInr,
        discountCode,
        totalInr,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyDiscountCode,
        removeDiscountCode,
        isCartOpen,
        setIsCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
