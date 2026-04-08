'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, MapPin, Truck, Send, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { getImageUrl, supabase } from '@/lib/supabase';

type Entrega = 'recoger' | 'domicilio';

export default function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, totalPrice, updateQty, removeItem, clearCart } =
    useCart();
  const [entrega, setEntrega] = useState<Entrega>('recoger');
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const DIRECCION_TIENDA = 'Col. Los Reyes, C. Sor Juana Inés de la Cruz #4, San Bartolo Tutotepec, Hgo.';

  const handleSendOrder = async () => {
    setSending(true);

    // Guardar pedido en Supabase antes de abrir WhatsApp
    try {
      await supabase.from('pedidos').insert({
        items: items.map((i) => ({
          sabor_id: i.sabor.id,
          nombre: i.sabor.nombre,
          precio: i.sabor.precio,
          cantidad: i.cantidad,
        })),
        total: totalPrice,
        tipo_entrega: entrega,
        direccion: entrega === 'domicilio' ? direccion : null,
        referencia: entrega === 'domicilio' ? referencia : null,
      });
    } catch {}

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '521234567890';

    const lineas = items.map(
      (item) =>
        `▸ ${item.cantidad}x ${item.sabor.nombre} — $${item.sabor.precio * item.cantidad}`
    );

    const tipoEntrega =
      entrega === 'recoger'
        ? `📍 *Paso a recoger*\n${DIRECCION_TIENDA}`
        : `🚗 *Entrega a domicilio*\n📍 ${direccion || 'Sin dirección'}${referencia ? `\n📝 Referencia: ${referencia}` : ''}`;

    const mensaje = [
      '🍦 *¡Nuevo Pedido de Boly\'s!*',
      '━━━━━━━━━━━━━━━',
      ...lineas,
      '━━━━━━━━━━━━━━━',
      `💰 *Total: $${totalPrice} MXN*`,
      '',
      tipoEntrega,
      '',
      '¡Gracias! 😊',
    ].join('\n');

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;

    // Animate before opening
    setTimeout(() => {
      setSent(true);
      setTimeout(() => {
        window.open(url, '_blank');
        clearCart();
        setSending(false);
        setSent(false);
      }, 1500);
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ rotate: -20 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: 'spring' }}
                >
                  <ShoppingBag className="w-5 h-5 text-boli-orange" />
                </motion.div>
                <h2 className="font-display font-bold text-lg text-gray-800">
                  Mi Pedido
                </h2>
                <span className="bg-boli-orange/10 text-boli-orange text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Sent animation overlay */}
            <AnimatePresence>
              {sent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="text-7xl"
                  >
                    🎉
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-display font-bold text-xl text-gray-800"
                  >
                    ¡Pedido enviado!
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-400 text-sm"
                  >
                    Abriendo WhatsApp...
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <span className="text-6xl">🛒</span>
                  <p className="font-display font-semibold text-gray-400">
                    Tu carrito está vacío
                  </p>
                  <p className="text-gray-300 text-sm">
                    ¡Agrega bolis del menú!
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {items.map((item, i) => (
                    <motion.div
                      key={item.sabor.id}
                      layout
                      initial={{ opacity: 0, x: 50, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        x: -100,
                        scale: 0.6,
                        transition: { duration: 0.3 },
                      }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-white overflow-hidden flex-shrink-0 relative">
                        {item.sabor.imagen_url ? (
                          <Image
                            src={getImageUrl(item.sabor.imagen_url)}
                            alt={item.sabor.nombre}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🍦
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-sm text-gray-800 truncate">
                          {item.sabor.nombre}
                        </h4>
                        <p className="text-boli-orange font-display font-bold text-sm">
                          ${item.sabor.precio * item.cantidad}
                        </p>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => updateQty(item.sabor.id, item.cantidad - 1)}
                          className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 transition"
                        >
                          {item.cantidad === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-gray-500" />
                          )}
                        </motion.button>

                        <motion.span
                          key={item.cantidad}
                          initial={{ scale: 1.4 }}
                          animate={{ scale: 1 }}
                          className="w-8 text-center font-display font-bold text-sm text-gray-800"
                        >
                          {item.cantidad}
                        </motion.span>

                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => updateQty(item.sabor.id, item.cantidad + 1)}
                          className="w-8 h-8 rounded-xl bg-boli-orange/10 flex items-center justify-center hover:bg-boli-orange/20 transition"
                        >
                          <Plus className="w-3.5 h-3.5 text-boli-orange" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer: delivery type + send */}
            {items.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="border-t border-gray-100 p-4 space-y-4 bg-white"
              >
                {/* Delivery type */}
                <div>
                  <p className="text-xs font-display font-semibold text-gray-500 mb-2">
                    Tipo de entrega
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setEntrega('recoger')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-display font-semibold text-sm transition-all ${
                        entrega === 'recoger'
                          ? 'bg-boli-orange text-white shadow-md'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      Recoger
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setEntrega('domicilio')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-display font-semibold text-sm transition-all ${
                        entrega === 'domicilio'
                          ? 'bg-boli-orange text-white shadow-md'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      Domicilio
                    </motion.button>
                  </div>
                </div>

                {/* Address input for delivery */}
                <AnimatePresence>
                  {entrega === 'domicilio' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-2"
                    >
                      <input
                        type="text"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Tu dirección completa..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition"
                      />
                      <input
                        type="text"
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        placeholder="Referencia (ej: casa azul, junto a la tienda...)"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition"
                      />
                    </motion.div>
                  )}
                  {entrega === 'recoger' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <a
                        href="https://maps.google.com/?q=20.397146,-98.199482"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 bg-boli-orange/5 border border-boli-orange/20 rounded-2xl p-3"
                      >
                        <MapPin className="w-4 h-4 text-boli-orange flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-700 font-display">Recoger en:</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Col. Los Reyes, C. Sor Juana Inés de la Cruz #4, San Bartolo Tutotepec, Hgo.
                          </p>
                          <p className="text-[10px] text-boli-orange font-semibold mt-1">
                            📍 Ver en Google Maps
                          </p>
                        </div>
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Total + Send */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Total</p>
                    <motion.p
                      key={totalPrice}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="font-display font-bold text-2xl text-gray-800"
                    >
                      ${totalPrice}
                    </motion.p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={handleSendOrder}
                    disabled={sending || (entrega === 'domicilio' && !direccion.trim())}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-display font-bold px-6 py-3.5 rounded-2xl shadow-lg disabled:opacity-50 transition-all"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.388A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.153 0-4.16-.655-5.833-1.778l-.376-.253-3.124.919.848-3.18-.267-.397A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
                    </svg>
                    Enviar Pedido
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
