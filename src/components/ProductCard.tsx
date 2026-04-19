'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Flame } from 'lucide-react';
import Image from 'next/image';
import type { Producto } from '@/types';
import { getImageUrl } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';
import ProductDetail from '@/components/ProductDetail';
import ReservaModal from '@/components/ReservaModal';

const categoryStyles: Record<string, { bg: string; badge: string; text: string; btn: string }> = {
  Agua: { bg: 'from-sky-50 to-cyan-50', badge: 'bg-boli-blue/15 text-boli-blue', text: 'text-boli-blue', btn: 'bg-boli-blue hover:bg-cyan-500' },
  Leche: { bg: 'from-pink-50 to-rose-50', badge: 'bg-boli-pink/15 text-boli-pink', text: 'text-boli-pink', btn: 'bg-boli-pink hover:bg-rose-400' },
  Gourmet: { bg: 'from-violet-50 to-purple-50', badge: 'bg-boli-purple/15 text-boli-purple', text: 'text-boli-purple', btn: 'bg-boli-purple hover:bg-violet-500' },
  General: { bg: 'from-amber-50 to-orange-50', badge: 'bg-boli-orange/15 text-boli-orange', text: 'text-boli-orange', btn: 'bg-boli-orange hover:bg-orange-600' },
};

interface Props {
  sabor: Producto;
  index: number;
  isTopSeller?: boolean;
}

export default function ProductCard({ sabor, index, isTopSeller }: Props) {
  const style = categoryStyles[sabor.categoria] ?? categoryStyles.General;
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [flyEmoji, setFlyEmoji] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showReserva, setShowReserva] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sabor.tipo_producto === 'paquete') {
      setShowReserva(true);
      return;
    }
    addItem(sabor);
    setJustAdded(true);
    setFlyEmoji(true);
    if (navigator.vibrate) navigator.vibrate(25);
    setTimeout(() => setJustAdded(false), 1200);
    setTimeout(() => setFlyEmoji(false), 800);
  };

  return (
    <>
      <motion.div
        layoutId={`card-${sabor.id}`}
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.35, delay: index * 0.06 }}
        onClick={() => setExpanded(true)}
        className={`
          relative bg-gradient-to-br ${style.bg}
          rounded-3xl overflow-hidden shadow-card
          border border-white/60 cursor-pointer
        `}
      >
        {/* Flying emoji */}
        <AnimatePresence>
          {flyEmoji && (
            <motion.span
              initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 0.4, x: 60, y: -120 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute bottom-16 right-8 z-30 text-3xl pointer-events-none"
            >
              🍦
            </motion.span>
          )}
        </AnimatePresence>

        {/* Image */}
        <div className="relative w-full aspect-square bg-white/40">
          {sabor.imagen_url ? (
            <Image src={getImageUrl(sabor.imagen_url)} alt={sabor.nombre} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><span className="text-5xl">🍦</span></div>
          )}
          <span className={`absolute top-3 left-3 ${style.badge} text-xs font-bold font-display px-3 py-1 rounded-full backdrop-blur-sm`}>
            {sabor.categoria}
          </span>
          {isTopSeller && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: index * 0.06 + 0.3 }} className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold font-display px-2 py-1 rounded-full flex items-center gap-0.5 shadow-md">
              <Flame className="w-3 h-3" /> Top
            </motion.span>
          )}
          {/* "Tap to see more" hint */}
          {(sabor.detalles || (sabor.incluye && sabor.incluye.length > 0) || (sabor.imagenes_extra && sabor.imagenes_extra.length > 0)) && (
            <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-1 rounded-full">
              Ver más
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-display font-bold text-lg text-gray-800 leading-tight">{sabor.nombre}</h3>
            {sabor.descripcion && <p className="text-gray-500 text-xs mt-1 line-clamp-2 font-medium">{sabor.descripcion}</p>}
          </div>
          <div className="flex items-center justify-between">
            <span className={`font-display font-bold text-xl ${style.text}`}>${sabor.precio}</span>
            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.85 }}
              animate={justAdded ? { scale: [1, 1.2, 1] } : {}}
              className={`flex items-center gap-1.5 text-white text-xs font-bold font-display px-4 py-2.5 rounded-2xl shadow-md transition-all duration-300 ${justAdded ? 'bg-green-500' : style.btn}`}
            >
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.span key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400 }} className="flex items-center gap-1">
                    <Check className="w-4 h-4" /> ¡Listo!
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Agregar
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Expanded detail modal */}
      <AnimatePresence>
        {expanded && (
          <ProductDetail
            producto={sabor}
            onClose={() => setExpanded(false)}
            isTopSeller={isTopSeller}
          />
        )}
      </AnimatePresence>

      {/* Reserva modal for paquete products */}
      <AnimatePresence>
        {showReserva && (
          <ReservaModal producto={sabor} onClose={() => setShowReserva(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
