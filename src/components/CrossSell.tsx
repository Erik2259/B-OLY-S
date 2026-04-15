'use client';

import { motion } from 'framer-motion';
import { Gift, ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import type { Producto } from '@/types';

interface Props {
  productos: Producto[];
  onSwitchTab: () => void;
}

export default function CrossSell({ productos, onSwitchTab }: Props) {
  const { totalItems } = useCart();

  // Only show if user has items in cart
  if (totalItems < 2 || productos.length === 0) return null;

  const featured = productos[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="mt-6"
    >
      <motion.button
        onClick={onSwitchTab}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3 text-left"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-gray-800">
            ¿Conoces nuestros productos especiales?
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Mira {featured.nombre} y más → ¡No te los pierdas!
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-boli-orange flex-shrink-0" />
      </motion.button>
    </motion.div>
  );
}
