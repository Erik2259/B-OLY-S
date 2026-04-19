'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, AlertTriangle, CheckCircle2, Package, Loader2, ChevronDown, Truck, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Reserva, EstadoReserva } from '@/types';
import { PUNTOS_MEDIOS_SBT } from '@/types';

const ESTADO_STYLES: Record<EstadoReserva, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente' },
  confirmada: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmada' },
  preparando: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Preparando' },
  entregada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Entregada' },
  cancelada: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
};

const METODO_ICONS: Record<string, React.ReactNode> = {
  recoger: <MapPin className="w-3.5 h-3.5" />,
  punto_medio: <Users className="w-3.5 h-3.5" />,
  domicilio: <Truck className="w-3.5 h-3.5" />,
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyLevel(dateStr: string): 'overdue' | 'urgent' | 'soon' | 'normal' {
  const days = getDaysUntil(dateStr);
  if (days < 0) return 'overdue';
  if (days <= 1) return 'urgent';
  if (days <= 3) return 'soon';
  return 'normal';
}

function getMapsUrl(reserva: Reserva): string {
  if (reserva.metodo_entrega === 'recoger') return 'https://maps.google.com/?q=20.397146,-98.199482';
  if (reserva.metodo_entrega === 'punto_medio') {
    const punto = PUNTOS_MEDIOS_SBT.find((p) => p.nombre === reserva.ubicacion_detalle);
    return punto ? `https://maps.google.com/?q=${punto.coords}` : `https://maps.google.com/?q=${encodeURIComponent(reserva.ubicacion_detalle || '')}`;
  }
  return `https://maps.google.com/?q=${encodeURIComponent((reserva.ubicacion_detalle || '') + ' San Bartolo Tutotepec')}`;
}

export default function Agenda() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'activas' | 'todas' | 'entregadas'>('activas');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchReservas(); }, [filtro]);

  const fetchReservas = async () => {
    setLoading(true);
    let query = supabase.from('reservas').select('*').order('fecha_entrega', { ascending: true });
    if (filtro === 'activas') query = query.in('estado', ['pendiente', 'confirmada', 'preparando']);
    else if (filtro === 'entregadas') query = query.in('estado', ['entregada', 'cancelada']);
    const { data } = await query;
    setReservas(data || []);
    setLoading(false);
  };

  const updateEstado = async (id: string, estado: EstadoReserva) => {
    await supabase.from('reservas').update({ estado }).eq('id', id);
    fetchReservas();
  };

  // Sort: urgent first
  const sorted = [...reservas].sort((a, b) => {
    if (filtro !== 'activas') return 0;
    const urgA = getDaysUntil(a.fecha_entrega);
    const urgB = getDaysUntil(b.fecha_entrega);
    return urgA - urgB;
  });

  const urgentCount = reservas.filter((r) => ['overdue', 'urgent'].includes(getUrgencyLevel(r.fecha_entrega)) && !['entregada', 'cancelada'].includes(r.estado)).length;

  return (
    <div className="space-y-5 pb-8">
      {/* Urgent alert */}
      {urgentCount > 0 && filtro === 'activas' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display font-bold text-sm">¡{urgentCount} entrega{urgentCount > 1 && 's'} urgente{urgentCount > 1 && 's'}!</p>
            <p className="text-white/80 text-xs">Necesita{urgentCount > 1 && 'n'} prepararse hoy o mañana</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'activas' as const, label: 'Próximas' },
          { key: 'todas' as const, label: 'Todas' },
          { key: 'entregadas' as const, label: 'Historial' },
        ].map((f) => (
          <button key={f.key} onClick={() => setFiltro(f.key)} className={`px-4 py-2 rounded-xl font-display font-semibold text-sm transition-all ${filtro === f.key ? 'bg-boli-purple text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-boli-purple animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📅</span>
          <p className="text-gray-400 font-display font-semibold mt-4">No hay reservas {filtro === 'activas' ? 'pendientes' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((reserva, i) => {
            const urgency = getUrgencyLevel(reserva.fecha_entrega);
            const daysUntil = getDaysUntil(reserva.fecha_entrega);
            const isExpanded = expandedId === reserva.id;
            const estadoStyle = ESTADO_STYLES[reserva.estado as EstadoReserva] || ESTADO_STYLES.pendiente;
            const isActive = !['entregada', 'cancelada'].includes(reserva.estado);

            return (
              <motion.div
                key={reserva.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  isActive && urgency === 'overdue' ? 'border-red-300 ring-2 ring-red-100' :
                  isActive && urgency === 'urgent' ? 'border-rose-300 ring-2 ring-rose-100' :
                  isActive && urgency === 'soon' ? 'border-amber-200' :
                  'border-gray-100'
                }`}
              >
                {/* Urgency tag */}
                {isActive && (urgency === 'overdue' || urgency === 'urgent') && (
                  <div className={`px-4 py-1.5 text-[10px] font-display font-bold uppercase tracking-wide flex items-center gap-1.5 ${urgency === 'overdue' ? 'bg-red-500 text-white' : 'bg-rose-100 text-rose-600'}`}>
                    <AlertTriangle className="w-3 h-3" />
                    {urgency === 'overdue' ? '⚠️ ATRASADA — CONTACTAR CLIENTE' : '🔴 URGENTE — PREPARAR HOY'}
                  </div>
                )}

                <button onClick={() => setExpandedId(isExpanded ? null : reserva.id)} className="w-full text-left p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-sm text-gray-800">{reserva.cantidad}x {reserva.producto_nombre}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${estadoStyle.bg} ${estadoStyle.text}`}>{estadoStyle.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(reserva.fecha_entrega + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                        {reserva.hora_entrega && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {reserva.hora_entrega}</span>}
                        <span className="flex items-center gap-1">{METODO_ICONS[reserva.metodo_entrega]} {reserva.metodo_entrega === 'recoger' ? 'Recoger' : reserva.metodo_entrega === 'punto_medio' ? 'Punto medio' : 'Domicilio'}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">👤 {reserva.cliente_nombre} {reserva.cliente_telefono ? `· 📱 ${reserva.cliente_telefono}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-display font-bold text-lg text-gray-800">${reserva.total}</p>
                      {isActive && (
                        <p className={`text-[10px] font-semibold ${daysUntil < 0 ? 'text-red-500' : daysUntil <= 1 ? 'text-rose-500' : daysUntil <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                          {daysUntil < 0 ? `hace ${Math.abs(daysUntil)}d` : daysUntil === 0 ? '¡HOY!' : daysUntil === 1 ? 'Mañana' : `en ${daysUntil}d`}
                        </p>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-300 ml-auto mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100">
                      <div className="p-4 space-y-3">
                        {/* Delivery details + Map */}
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-display font-semibold text-gray-600 mb-1">📍 Entrega</p>
                          <p className="text-sm text-gray-700">{reserva.ubicacion_detalle || 'Sin detalles'}</p>
                          <a href={getMapsUrl(reserva)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-boli-orange font-semibold mt-2">
                            <MapPin className="w-3 h-3" /> Abrir en Google Maps →
                          </a>
                        </div>

                        {reserva.notas && (
                          <div className="bg-amber-50 rounded-xl p-3">
                            <p className="text-xs font-display font-semibold text-amber-700">📝 Notas</p>
                            <p className="text-sm text-gray-700 mt-0.5">{reserva.notas}</p>
                          </div>
                        )}

                        {/* State actions */}
                        {isActive && (
                          <div className="flex gap-2 flex-wrap">
                            {reserva.estado === 'pendiente' && (
                              <button onClick={() => updateEstado(reserva.id, 'confirmada')} className="flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                              </button>
                            )}
                            {reserva.estado === 'confirmada' && (
                              <button onClick={() => updateEstado(reserva.id, 'preparando')} className="flex items-center gap-1 bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
                                <Package className="w-3.5 h-3.5" /> Preparando
                              </button>
                            )}
                            {(reserva.estado === 'confirmada' || reserva.estado === 'preparando') && (
                              <button onClick={() => updateEstado(reserva.id, 'entregada')} className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Entregado
                              </button>
                            )}
                            <button onClick={() => updateEstado(reserva.id, 'cancelada')} className="flex items-center gap-1 bg-gray-200 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl">
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
