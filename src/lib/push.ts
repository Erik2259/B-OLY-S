'use client';

import { supabase } from '@/lib/supabase';

// VAPID public key - generate your own at https://vapidkeys.com
// This is a placeholder - replace with your actual VAPID public key
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return false;
    
    const permission = await requestNotificationPermission();
    if (!permission) return false;

    const registration = await navigator.serviceWorker.ready;
    
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }

    // Save subscription to Supabase
    await supabase.from('push_subscriptions').insert({
      subscription: subscription.toJSON(),
    });

    return true;
  } catch {
    return false;
  }
}

// Local notification fallback (works without VAPID)
export async function showLocalNotification(title: string, body: string, url?: string): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      data: { url: url || '/admin' },
    } as NotificationOptions);
  } catch {
    // Fallback to basic notification
    new Notification(title, { body, icon: '/icons/icon-192.png' });
  }
}

// Check for upcoming deliveries and show reminders
export async function checkDeliveryReminders(): Promise<void> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const today = new Date().toISOString().split('T')[0];

    const { data: reservas } = await supabase
      .from('reservas')
      .select('*')
      .in('estado', ['pendiente', 'confirmada', 'preparando'])
      .lte('fecha_entrega', tomorrowStr)
      .gte('fecha_entrega', today);

    if (reservas && reservas.length > 0) {
      const todayReservas = reservas.filter((r) => r.fecha_entrega === today);
      const tomorrowReservas = reservas.filter((r) => r.fecha_entrega === tomorrowStr);

      if (todayReservas.length > 0) {
        const total = todayReservas.reduce((s, r) => s + r.cantidad, 0);
        await showLocalNotification(
          '⚠️ ¡Entregas HOY!',
          `Tienes ${total} kit${total > 1 ? 's' : ''} para entregar hoy. ¡A preparar!`,
          '/admin'
        );
      }

      if (tomorrowReservas.length > 0) {
        const total = tomorrowReservas.reduce((s, r) => s + r.cantidad, 0);
        await showLocalNotification(
          '🔔 Entregas mañana',
          `${total} kit${total > 1 ? 's' : ''} para entregar mañana. Preparalos con tiempo.`,
          '/admin'
        );
      }
    }
  } catch {}
}
