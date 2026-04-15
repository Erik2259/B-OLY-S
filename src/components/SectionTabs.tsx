'use client';

import { motion } from 'framer-motion';
import type { Categoria } from '@/types';

interface Props {
  categorias: Categoria[];
  active: string;
  onChange: (slug: string) => void;
}

export default function SectionTabs({ categorias, active, onChange }: Props) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto flex">
        {categorias.map((cat) => {
          const isActive = active === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => onChange(cat.slug)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 font-display font-bold text-sm transition-colors ${
                isActive ? 'text-boli-orange' : 'text-gray-400'
              }`}
            >
              <span>{cat.icono}</span>
              {cat.nombre}
              {isActive && (
                <motion.div
                  layoutId="sectionIndicator"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-boli-orange rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
