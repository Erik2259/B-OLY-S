'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

export default function CartButton() {
  const { totalItems, totalPrice, openCart, lastAdded, clearLastAdded } = useCart();
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (lastAdded) {
      setBounce(true);
      const t = setTimeout(() => {
        setBounce(false);
        clearLastAdded();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [lastAdded, clearLastAdded]);

  if (totalItems === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-4 right-4 z-30 max-w-lg mx-auto"
    >
      <motion.button
        onClick={openCart}
        whileTap={{ scale: 0.97 }}
        animate={bounce ? { scale: [1, 1.08, 1], y: [0, -6, 0] } : {}}
        transition={{ type: 'spring', stiffness: 400 }}
        className="w-full bg-gradient-to-r from-boli-orange to-amber-500 text-white rounded-2xl px-5 py-4 shadow-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <AnimatePresence mode="wait">
              <motion.span
                key={totalItems}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 bg-white text-boli-orange text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow"
              >
                {totalItems}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="font-display font-bold text-sm">Ver mi pedido</span>
        </div>
        <motion.span
          key={totalPrice}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="font-display font-bold text-lg"
        >
          ${totalPrice}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
