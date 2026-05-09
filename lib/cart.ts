// lib/cart.ts — Cart state management with localStorage persistence
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  image_url?: string;
  selling_price: number;          // effective price (promo applied)
  original_price: number;         // original selling_price before promo
  purchase_price: number;
  quantity: number;
  selectedColor?: string;
  promo_type?: 'percentage' | 'fixed' | null;
  promo_value?: number | null;
  color_options?: string[];
}

const CART_KEY = 'prime_watches_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.productId === item.productId && i.selectedColor === item.selectedColor
      );
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId && i.selectedColor === item.selectedColor
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string, selectedColor?: string) => {
    setItems(prev => prev.filter(
      i => !(i.productId === productId && i.selectedColor === selectedColor)
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, selectedColor: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, selectedColor);
      return;
    }
    setItems(prev => prev.map(i =>
      i.productId === productId && i.selectedColor === selectedColor
        ? { ...i, quantity }
        : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.selling_price * i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, hydrated };
}
