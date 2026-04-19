'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Truck, Users, Minus, Plus, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Producto, MetodoEntrega } from '@/types';
import { PUNTOS_MEDIOS_SBT } from '@/types';
import { supabase } from '@/lib/supabase';
import { getCustomerId, getCustomerName, setCustomerName } from '@/lib/customer';

interface Props {
  producto: Producto;
  onClose: () => void;
}

type Step = 'form' | 'confirm' | 'done';

export default function ReservaModal({ producto, onClose }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [cantidad, setCantidad] = useState(1);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('16:00');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodo, setMetodo] = useState<MetodoEntrega>('recoger');
  const [puntoMedio, setPuntoMedio] = useState<string>(PUNTOS_MEDIOS_SBT[0].id);
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const DIRECCION_TIENDA = 'Col. Los Reyes, C. Sor Juana Inés de la Cruz #4';
  const total = cantidad * producto.precio;

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    const saved = getCustomerName();
    if (saved) setNombre(saved);
  }, []);

  const getUbicacionDetalle = (): string => {
    if (metodo === 'recoger') return DIRECCION_TIENDA;
    if (metodo === 'punto_medio') {
      const punto = PUNTOS_MEDIOS_SBT.find((p) => p.id === puntoMedio);
      return punto ? punto.nombre : '';
    }
    return direccion;
  };

  const getMapsUrl = (): string => {
    if (metodo === 'recoger') return 'https://maps.google.com/?q=20.397146,-98.199482';
    if (metodo === 'punto_medio') {
      const punto = PUNTOS_MEDIOS_SBT.find((p) => p.id === puntoMedio);
      return punto ? `https://maps.google.com/?q=${punto.coords}` : '';
    }
    return `https://maps.google.com/?q=${encodeURIComponent(direccion + ' San Bartolo Tutotepec')}`;
  };

  const handleConfirm = () => setStep('confirm');

  const handleSend = async () => {
    setSaving(true);
    if (nombre.trim()) setCustomerName(nombre.trim());

    // Save to Supabase
    try {
      await supabase.from('reservas').insert({
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        cantidad,
        fecha_entrega: fechaEntrega,
        hora_entrega: horaEntrega,
        cliente_nombre: nombre.trim(),
        cliente_telefono: telefono.trim() || null,
        customer_id: getCustomerId(),
        metodo_entrega: metodo,
        ubicacion_detalle: getUbicacionDetalle(),
        notas: notas.trim() || null,
        estado: 'pendiente',
        total,
      });
    } catch {}

    // WhatsApp message
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '521234567890';
    const puntoLabel = metodo === 'recoger'
      ? `📍 *Recoger en:* ${DIRECCION_TIENDA}`
      : metodo === 'punto_medio'
      ? `📍 *Punto medio:* ${PUNTOS_MEDIOS_SBT.find((p) => p.id === puntoMedio)?.nombre}`
      : `🚗 *Domicilio:* ${direccion}`;

    const mensaje = [
      `📅 *¡Nueva Reserva — Boly's!*`,
      '━━━━━━━━━━━━━━━',
      `🎨 *${cantidad}x ${producto.nombre}*`,
      `💰 *Total: $${total} MXN*`,
      '━━━━━━━━━━━━━━━',
      `📆 *Fecha:* ${new Date(fechaEntrega + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      `⏰ *Hora:* ${horaEntrega}`,
      `👤 *Cliente:* ${nombre.trim()}`,
      telefono ? `📱 *Tel:* ${telefono}` : '',
      '',
      puntoLabel,
      notas ? `📝 *Notas:* ${notas}` : '',
      '',
      '⏳ Estado: _Pendiente de confirmación_',
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`;

    setStep('done');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#FFD93D', '#FF8C00', '#AB47BC', '#4FC3F7'] });
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);

    setTimeout(() => {
      window.open(url, '_blank');
      onClose();
    }, 2000);
  };

  const isFormValid = nombre.trim() && fechaEntrega && (metodo !== 'domicilio' || direccion.trim());

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md" />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh]"
      >
        <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-display font-bold text-lg text-gray-800">
                {step === 'done' ? '¡Reserva enviada!' : step === 'confirm' ? 'Confirmar reserva' : '📅 Reservar para evento'}
              </h2>
              <p className="text-xs text-gray-400">{producto.nombre}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Done state */}
          <AnimatePresence mode="wait">
            {step === 'done' ? (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center py-16 px-6 gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.6 }}>
                  <CheckCircle2 className="w-20 h-20 text-green-500" />
                </motion.div>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-display font-bold text-xl text-gray-800 text-center">
                  ¡Reserva registrada, {nombre.trim()}!
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-gray-400 text-sm text-center">
                  Abriendo WhatsApp para confirmar...
                </motion.p>
              </motion.div>

            ) : step === 'confirm' ? (
              <motion.div key="confirm" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Summary */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-orange-100">
                  <h3 className="font-display font-bold text-base text-gray-800">{cantidad}x {producto.nombre}</h3>
                  <p className="text-2xl font-display font-bold text-boli-orange mt-1">${total} MXN</p>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: <Calendar className="w-4 h-4" />, label: 'Fecha', value: new Date(fechaEntrega + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) },
                    { icon: <Clock className="w-4 h-4" />, label: 'Hora', value: horaEntrega },
                    { icon: <Users className="w-4 h-4" />, label: 'Cliente', value: nombre },
                    { icon: <MapPin className="w-4 h-4" />, label: 'Entrega', value: metodo === 'recoger' ? `Recoger en ${DIRECCION_TIENDA}` : metodo === 'punto_medio' ? PUNTOS_MEDIOS_SBT.find(p => p.id === puntoMedio)?.nombre : direccion },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      <span className="text-boli-orange mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-700">{item.value}</p>
                      </div>
                    </div>
                  ))}
                  {notas && (
                    <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      <MessageSquare className="w-4 h-4 text-boli-orange mt-0.5" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Notas</p>
                        <p className="text-sm font-semibold text-gray-700">{notas}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep('form')} className="flex-1 py-3.5 rounded-2xl font-display font-semibold text-sm bg-gray-100 text-gray-500">
                    Editar
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={saving}
                    className="flex-[2] flex items-center justify-center gap-2 bg-green-500 text-white font-display font-bold py-3.5 rounded-2xl shadow-lg disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.388A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.153 0-4.16-.655-5.833-1.778l-.376-.253-3.124.919.848-3.18-.267-.397A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    Enviar Reserva
                  </motion.button>
                </div>
              </motion.div>

            ) : (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Quantity */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Cantidad de kits</label>
                  <div className="flex items-center gap-4 mt-2">
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Minus className="w-4 h-4 text-gray-600" />
                    </motion.button>
                    <motion.span key={cantidad} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display font-bold text-2xl text-gray-800 w-8 text-center">{cantidad}</motion.span>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setCantidad(cantidad + 1)} className="w-10 h-10 rounded-xl bg-boli-orange/10 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-boli-orange" />
                    </motion.button>
                    <span className="text-gray-400 text-sm ml-auto font-display font-bold">${total} MXN</span>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-boli-orange" /> Fecha del evento
                  </label>
                  <input type="date" min={minDate} value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} required className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition" />
                </div>

                {/* Time */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-boli-orange" /> Hora de entrega
                  </label>
                  <input type="time" value={horaEntrega} onChange={(e) => setHoraEntrega(e.target.value)} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition" />
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Nombre del responsable</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Tu nombre..." className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition" />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Teléfono (opcional)</label>
                  <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="775 123 4567" className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition" />
                </div>

                {/* Delivery method */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600 mb-2 block">Logística de entrega</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'recoger' as MetodoEntrega, icon: <MapPin className="w-4 h-4" />, label: 'Recoger' },
                      { key: 'punto_medio' as MetodoEntrega, icon: <Users className="w-4 h-4" />, label: 'Punto medio' },
                      { key: 'domicilio' as MetodoEntrega, icon: <Truck className="w-4 h-4" />, label: 'Domicilio' },
                    ].map((m) => (
                      <motion.button key={m.key} whileTap={{ scale: 0.95 }} onClick={() => setMetodo(m.key)} className={`flex flex-col items-center gap-1 py-3 rounded-2xl font-display font-semibold text-xs transition-all ${metodo === m.key ? 'bg-boli-orange text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                        {m.icon} {m.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Delivery details */}
                <AnimatePresence>
                  {metodo === 'recoger' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <a href="https://maps.google.com/?q=20.397146,-98.199482" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 bg-boli-orange/5 border border-boli-orange/20 rounded-2xl p-3">
                        <MapPin className="w-4 h-4 text-boli-orange flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-700 font-display">Recoger en:</p>
                          <p className="text-xs text-gray-500 mt-0.5">{DIRECCION_TIENDA}, San Bartolo Tutotepec</p>
                          <p className="text-[10px] text-boli-orange font-semibold mt-1">📍 Ver en Maps</p>
                        </div>
                      </a>
                    </motion.div>
                  )}
                  {metodo === 'punto_medio' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <select value={puntoMedio} onChange={(e) => setPuntoMedio(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition appearance-none">
                        {PUNTOS_MEDIOS_SBT.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                  {metodo === 'domicilio' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección exacta en San Bartolo Tutotepec..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notes */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Notas adicionales</label>
                  <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Ej: Es para una fiesta infantil de 20 niños..." className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-orange transition resize-none" />
                </div>

                {/* Continue */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  disabled={!isFormValid}
                  className="w-full bg-gradient-to-r from-boli-orange to-amber-500 text-white font-display font-bold py-4 rounded-2xl shadow-lg disabled:opacity-40 transition-all"
                >
                  Revisar Reserva → ${total}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
