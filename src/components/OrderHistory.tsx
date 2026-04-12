'use client';

import { motion } from 'framer-motion';
import { Clock, RotateCcw } from 'lucide-react';
import { getOrderHistory } from '@/lib/customer';
import { useCart } from '@/lib/cart-context';
import type { Sabor } from '@/types';

interface Props {
  sabores: Sabor[];
}

export default function OrderHistory({ sabores }: Props) {
  const history = getOrderHistory().slice(0, 3);
  const { addItem, openCart } = useCart();

  if (history.length === 0) return null;

  const handleRepeat = (order: (typeof history)[0]) => {
    order.items.forEach((item) => {
      const sabor = sabores.find((s) => s.id === item.sabor_id);
      if (sabor) {
        for (let i = 0; i < item.cantidad; i++) {
          addItem(sabor);
        }
      }
    });
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    setTimeout(() => openCart(), 300);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'ayer';
    return `hace ${days} días`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 mb-4"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Clock className="w-4 h-4 text-gray-400" />
        <h2 className="font-display font-bold text-sm text-gray-700">
          Pedidos recientes
        </h2>
      </div>

      <div className="space-y-2">
        {history.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="flex items-center justify-between bg-gray-50 rounded-2xl p-3 border border-gray-100"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">
                {order.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                ${order.total} · {timeAgo(order.date)}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.85, rotate: -180 }}
              onClick={() => handleRepeat(order)}
              className="flex items-center gap-1 bg-boli-orange/10 text-boli-orange text-xs font-display font-bold px-3 py-2 rounded-xl ml-2 flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Repetir
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
