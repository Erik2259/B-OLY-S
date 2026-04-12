'use client';

const CUSTOMER_ID_KEY = 'bolys-customer-id';
const CUSTOMER_NAME_KEY = 'bolys-customer-name';
const ORDER_HISTORY_KEY = 'bolys-order-history';
const FLAVOR_COUNT_KEY = 'bolys-flavor-count';

// Generate or retrieve a persistent customer UUID
export function getCustomerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(CUSTOMER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(CUSTOMER_ID_KEY, id);
  }
  return id;
}

export function getCustomerName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CUSTOMER_NAME_KEY) || '';
}

export function setCustomerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOMER_NAME_KEY, name);
}

// Order history
export interface SavedOrder {
  id: string;
  items: { sabor_id: string; nombre: string; precio: number; cantidad: number }[];
  total: number;
  tipo_entrega: string;
  date: string;
}

export function getOrderHistory(): SavedOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDER_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Omit<SavedOrder, 'id' | 'date'>): void {
  if (typeof window === 'undefined') return;
  const history = getOrderHistory();
  const newOrder: SavedOrder = {
    ...order,
    id: crypto.randomUUID?.() || `${Date.now()}`,
    date: new Date().toISOString(),
  };
  // Keep only last 10 orders
  history.unshift(newOrder);
  if (history.length > 10) history.pop();
  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history));

  // Update flavor counts
  updateFlavorCounts(order.items);
}

// Flavor frequency tracking (for favorites)
export function getFlavorCounts(): Record<string, { nombre: string; count: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FLAVOR_COUNT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function updateFlavorCounts(items: { sabor_id: string; nombre: string; cantidad: number }[]): void {
  const counts = getFlavorCounts();
  items.forEach((item) => {
    if (counts[item.sabor_id]) {
      counts[item.sabor_id].count += item.cantidad;
    } else {
      counts[item.sabor_id] = { nombre: item.nombre, count: item.cantidad };
    }
  });
  localStorage.setItem(FLAVOR_COUNT_KEY, JSON.stringify(counts));
}

// Get favorites (ordered > 3 times)
export function getFavorites(): { sabor_id: string; nombre: string; count: number }[] {
  const counts = getFlavorCounts();
  return Object.entries(counts)
    .filter(([, v]) => v.count >= 3)
    .map(([sabor_id, v]) => ({ sabor_id, nombre: v.nombre, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

// Get greeting based on time of day
export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const saludo = name ? `, ${name}` : '';

  if (hour >= 5 && hour < 12) return `¡Buenos días${saludo}! ☀️`;
  if (hour >= 12 && hour < 15) return `¿Un boli para el calor del mediodía${saludo}? 🔥`;
  if (hour >= 15 && hour < 19) return `¡Hora perfecta para un boli${saludo}! 🍦`;
  if (hour >= 19 && hour < 22) return `¡Buenas noches${saludo}! 🌙`;
  return `¿Antojo nocturno${saludo}? 😋`;
}
