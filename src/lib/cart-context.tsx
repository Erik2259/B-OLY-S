'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Sabor } from '@/types';

export interface CartItem {
  sabor: Sabor;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  lastAdded: string | null; // sabor id for animation
}

type CartAction =
  | { type: 'ADD'; sabor: Sabor }
  | { type: 'REMOVE'; saborId: string }
  | { type: 'UPDATE_QTY'; saborId: string; cantidad: number }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'CLEAR_LAST_ADDED' }
  | { type: 'LOAD'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.sabor.id === action.sabor.id);
      const newItems = existing
        ? state.items.map((i) =>
            i.sabor.id === action.sabor.id ? { ...i, cantidad: i.cantidad + 1 } : i
          )
        : [...state.items, { sabor: action.sabor, cantidad: 1 }];
      return { ...state, items: newItems, lastAdded: action.sabor.id };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.sabor.id !== action.saborId) };
    case 'UPDATE_QTY': {
      if (action.cantidad <= 0) {
        return { ...state, items: state.items.filter((i) => i.sabor.id !== action.saborId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.sabor.id === action.saborId ? { ...i, cantidad: action.cantidad } : i
        ),
      };
    }
    case 'CLEAR':
      return { ...state, items: [], isOpen: false };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'OPEN_CART':
      return { ...state, isOpen: true };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    case 'CLEAR_LAST_ADDED':
      return { ...state, lastAdded: null };
    case 'LOAD':
      return { ...state, items: action.items };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  lastAdded: string | null;
  totalItems: number;
  totalPrice: number;
  addItem: (sabor: Sabor) => void;
  removeItem: (saborId: string) => void;
  updateQty: (saborId: string, cantidad: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearLastAdded: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
    lastAdded: null,
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bolys-cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'LOAD', items: parsed });
        }
      }
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bolys-cart', JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.cantidad, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.sabor.precio * i.cantidad, 0);

  const addItem = useCallback((sabor: Sabor) => dispatch({ type: 'ADD', sabor }), []);
  const removeItem = useCallback((saborId: string) => dispatch({ type: 'REMOVE', saborId }), []);
  const updateQty = useCallback(
    (saborId: string, cantidad: number) => dispatch({ type: 'UPDATE_QTY', saborId, cantidad }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const toggleCart = useCallback(() => dispatch({ type: 'TOGGLE_CART' }), []);
  const openCart = useCallback(() => dispatch({ type: 'OPEN_CART' }), []);
  const closeCart = useCallback(() => dispatch({ type: 'CLOSE_CART' }), []);
  const clearLastAdded = useCallback(() => dispatch({ type: 'CLEAR_LAST_ADDED' }), []);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        lastAdded: state.lastAdded,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        clearLastAdded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
