'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { Producto } from '@/types';
import { getImageUrl } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';
import ProductDetail from '@/components/ProductDetail';

interface Props {
  producto: Producto;
  index: number;
}

export default function TemporadaBanner({ producto, index }: Props) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(producto);
    setJustAdded(true);
    if (navigator.vibrate) navigator.vibrate(25);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <>
      <motion.div
        layoutId={`card-${producto.id}`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={() => setExpanded(true)}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-orange-100 shadow-card cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-48 aspect-video sm:aspect-square bg-white/50">
            {producto.imagen_url ? (
              <Image src={getImageUrl(producto.imagen_url)} alt={producto.nombre} fill sizes="(max-width: 768px) 100vw, 200px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🎨</div>
            )}
            <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold font-display px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" /> Especial
            </span>
          </div>
          <div className="flex-1 p-5 flex flex-col justify-center">
            <h3 className="font-display font-bold text-xl text-gray-800">{producto.nombre}</h3>
            {producto.descripcion && <p className="text-gray-500 text-sm mt-1 line-clamp-2">{producto.descripcion}</p>}
            {producto.tipo_producto === 'paquete' && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full mt-2 w-fit">📦 Paquete completo</span>
            )}
            <div className="flex items-center justify-between mt-4">
              <span className="font-display font-bold text-2xl text-boli-orange">${producto.precio}</span>
              <motion.button onClick={handleAdd} whileTap={{ scale: 0.9 }} animate={justAdded ? { scale: [1, 1.15, 1] } : {}} className={`flex items-center gap-1.5 text-white text-sm font-bold font-display px-5 py-3 rounded-2xl shadow-md transition-all ${justAdded ? 'bg-green-500' : 'bg-gradient-to-r from-boli-orange to-amber-500'}`}>
                <AnimatePresence mode="wait">
                  {justAdded ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1"><Check className="w-4 h-4" /> ¡Agregado!</motion.span>
                  ) : (
                    <motion.span key="add" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar</motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && <ProductDetail producto={producto} onClose={() => setExpanded(false)} />}
      </AnimatePresence>
    </>
  );
}
