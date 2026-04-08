'use client';

import { motion } from 'framer-motion';
import { Droplets, IceCreamCone, Sparkles, LayoutGrid } from 'lucide-react';
import type { Categoria } from '@/types';

const categorias: { label: Categoria; icon: React.ReactNode; color: string }[] = [
  { label: 'Todos', icon: <LayoutGrid className="w-4 h-4" />, color: 'from-gray-600 to-gray-800' },
  { label: 'Agua', icon: <Droplets className="w-4 h-4" />, color: 'from-boli-blue to-cyan-500' },
  { label: 'Leche', icon: <IceCreamCone className="w-4 h-4" />, color: 'from-boli-pink to-rose-400' },
  { label: 'Gourmet', icon: <Sparkles className="w-4 h-4" />, color: 'from-boli-purple to-violet-500' },
];

interface Props {
  active: Categoria;
  onChange: (cat: Categoria) => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
      {categorias.map((cat) => {
        const isActive = active === cat.label;
        return (
          <motion.button
            key={cat.label}
            onClick={() => onChange(cat.label)}
            whileTap={{ scale: 0.93 }}
            className={`
              relative flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-display font-semibold text-sm
              whitespace-nowrap transition-all duration-200
              ${isActive
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
          >
            {cat.icon}
            {cat.label}
            {isActive && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
