'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { getFavorites } from '@/lib/customer';
import { useCart } from '@/lib/cart-context';
import { getImageUrl } from '@/lib/supabase';
import type { Sabor } from '@/types';

interface Props {
  sabores: Sabor[];
}

export default function Favorites({ sabores }: Props) {
  const favorites = getFavorites();
  const { addItem } = useCart();

  if (favorites.length === 0) return null;

  // Match favorites with actual sabor data
  const favSabores = favorites
    .map((fav) => sabores.find((s) => s.id === fav.sabor_id))
    .filter(Boolean) as Sabor[];

  if (favSabores.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Heart className="w-4 h-4 text-boli-pink fill-boli-pink" />
        <h2 className="font-display font-bold text-sm text-gray-700">
          Tus favoritos
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {favSabores.map((sabor, i) => (
          <motion.button
            key={sabor.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              addItem(sabor);
              if (navigator.vibrate) navigator.vibrate(30);
            }}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 w-20"
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-boli-pink/30 shadow-md bg-white">
              {sabor.imagen_url ? (
                <Image
                  src={getImageUrl(sabor.imagen_url)}
                  alt={sabor.nombre}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🍦
                </div>
              )}
              <div className="absolute inset-0 rounded-full ring-2 ring-boli-pink/20 ring-offset-1" />
            </div>
            <span className="text-[11px] font-display font-semibold text-gray-600 text-center leading-tight truncate w-full">
              {sabor.nombre}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
