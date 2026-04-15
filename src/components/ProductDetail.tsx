'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Plus, Check, ChevronLeft, ChevronRight, Package, Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { Producto } from '@/types';
import { getImageUrl } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';

interface Props {
  producto: Producto;
  onClose: () => void;
  isTopSeller?: boolean;
}

const categoryColors: Record<string, string> = {
  Agua: 'from-sky-400 to-cyan-500',
  Leche: 'from-pink-400 to-rose-500',
  Gourmet: 'from-violet-400 to-purple-500',
  General: 'from-amber-400 to-orange-500',
};

export default function ProductDetail({ producto, onClose, isTopSeller }: Props) {
  const { addItem, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  const allImages = [
    producto.imagen_url,
    ...(producto.imagenes_extra || []),
  ].filter(Boolean) as string[];

  const cantidadEnCarrito = items.find((i) => i.sabor.id === producto.id)?.cantidad || 0;

  const handleAdd = () => {
    addItem(producto);
    setJustAdded(true);
    if (navigator.vibrate) navigator.vibrate(25);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const nextImg = () => setCurrentImg((p) => (p + 1) % allImages.length);
  const prevImg = () => setCurrentImg((p) => (p - 1 + allImages.length) % allImages.length);

  const gradientColor = categoryColors[producto.categoria] || categoryColors.General;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
      />

      {/* Expanded card */}
      <motion.div
        layoutId={`card-${producto.id}`}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        className="fixed inset-x-0 bottom-0 top-8 sm:top-auto sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 px-0 sm:px-4"
      >
        <motion.div
          className="bg-white w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center sm:top-3 sm:right-3"
          >
            <X className="w-4 h-4 text-white" />
          </motion.button>

          {/* Image gallery */}
          <div className="relative w-full aspect-square sm:aspect-video bg-gray-100 flex-shrink-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImg}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative w-full h-full"
              >
                {allImages[currentImg] ? (
                  <Image
                    src={getImageUrl(allImages[currentImg])}
                    alt={producto.nombre}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-8xl">🍦</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Gallery navigation */}
            {allImages.length > 1 && (
              <>
                <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className={`bg-gradient-to-r ${gradientColor} text-white text-xs font-bold font-display px-3 py-1.5 rounded-full shadow-md`}>
                {producto.categoria}
              </span>
              {isTopSeller && (
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold font-display px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                  🔥 Top
                </span>
              )}
              {producto.tipo_producto === 'paquete' && (
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold font-display px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                  <Package className="w-3 h-3" /> Paquete
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Title + price */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-display font-bold text-2xl text-gray-800"
              >
                {producto.nombre}
              </motion.h2>
              {producto.descripcion && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-gray-500 text-sm mt-1.5 leading-relaxed"
                >
                  {producto.descripcion}
                </motion.p>
              )}
            </div>

            {/* Detailed description */}
            {producto.detalles && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-2xl p-4"
              >
                <p className="text-sm text-gray-600 leading-relaxed">{producto.detalles}</p>
              </motion.div>
            )}

            {/* What's included */}
            {producto.incluye && producto.incluye.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="font-display font-bold text-sm text-gray-700 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-boli-orange" />
                  Lo que incluye
                </h3>
                <div className="space-y-1.5">
                  {producto.incluye.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-2 bg-boli-orange/5 rounded-xl px-3 py-2"
                    >
                      <span className="w-5 h-5 bg-boli-orange/15 rounded-full flex items-center justify-center text-[10px] font-bold text-boli-orange">
                        ✓
                      </span>
                      <span className="text-sm text-gray-700 font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer: price + add button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-t border-gray-100 p-4 bg-white flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-gray-400 font-medium">Precio</p>
              <p className="font-display font-bold text-3xl text-gray-800">${producto.precio}</p>
              {cantidadEnCarrito > 0 && (
                <p className="text-xs text-boli-orange font-semibold mt-0.5">
                  {cantidadEnCarrito} en tu carrito
                </p>
              )}
            </div>

            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.9 }}
              animate={justAdded ? { scale: [1, 1.15, 1] } : {}}
              className={`flex items-center gap-2 text-white font-bold font-display px-7 py-4 rounded-2xl shadow-lg text-base transition-all ${
                justAdded ? 'bg-green-500' : `bg-gradient-to-r ${gradientColor}`
              }`}
            >
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                    <Check className="w-5 h-5" /> ¡Agregado!
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                    <Plus className="w-5 h-5" /> Agregar
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}
