'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie, AreaChart, Area,
} from 'recharts';
import { TrendingUp, Eye, DollarSign, ShoppingBag, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Pedido {
  id: string;
  items: { nombre: string; cantidad: number; precio: number }[];
  total: number;
  tipo_entrega: string;
  created_at: string;
}

interface Visita {
  id: string;
  created_at: string;
}

const COLORS = ['#FF8C00', '#4FC3F7', '#FF6B9D', '#66BB6A', '#AB47BC', '#FFD93D', '#EF5350', '#26C6DA'];

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState<'hoy' | 'semana' | 'mes'>('semana');

  useEffect(() => {
    fetchData();
  }, [rango]);

  const fetchData = async () => {
    setLoading(true);
    const now = new Date();
    let desde: Date;

    if (rango === 'hoy') {
      desde = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (rango === 'semana') {
      desde = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      desde = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const desdeStr = desde.toISOString();

    const [pedidosRes, visitasRes] = await Promise.all([
      supabase.from('pedidos').select('*').gte('created_at', desdeStr).order('created_at', { ascending: false }),
      supabase.from('visitas').select('*').gte('created_at', desdeStr),
    ]);

    setPedidos(pedidosRes.data || []);
    setVisitas(visitasRes.data || []);
    setLoading(false);
  };

  // === Cálculos ===
  const totalVentas = pedidos.reduce((s, p) => s + Number(p.total), 0);
  const totalPedidos = pedidos.length;
  const totalVisitas = visitas.length;
  const ticketPromedio = totalPedidos > 0 ? Math.round(totalVentas / totalPedidos) : 0;

  // Sabores más pedidos
  const saboresCount: Record<string, number> = {};
  pedidos.forEach((p) => {
    if (Array.isArray(p.items)) {
      p.items.forEach((item) => {
        saboresCount[item.nombre] = (saboresCount[item.nombre] || 0) + item.cantidad;
      });
    }
  });
  const topSabores = Object.entries(saboresCount)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 8);

  // Tráfico por hora
  const horasCount: Record<number, number> = {};
  for (let i = 0; i < 24; i++) horasCount[i] = 0;
  visitas.forEach((v) => {
    const h = new Date(v.created_at).getHours();
    horasCount[h] = (horasCount[h] || 0) + 1;
  });
  const traficoHoras = Object.entries(horasCount).map(([hora, visitas]) => ({
    hora: `${hora}h`,
    visitas,
  }));

  // Ventas por día
  const ventasDia: Record<string, number> = {};
  pedidos.forEach((p) => {
    const dia = new Date(p.created_at).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
    ventasDia[dia] = (ventasDia[dia] || 0) + Number(p.total);
  });
  const ventasPorDia = Object.entries(ventasDia).map(([dia, total]) => ({ dia, total }));

  // Tipo de entrega
  const recoger = pedidos.filter((p) => p.tipo_entrega === 'recoger').length;
  const domicilio = pedidos.filter((p) => p.tipo_entrega === 'domicilio').length;
  const entregaData = [
    { name: 'Recoger', value: recoger },
    { name: 'Domicilio', value: domicilio },
  ].filter((d) => d.value > 0);

  const rangoLabel = rango === 'hoy' ? 'Hoy' : rango === 'semana' ? 'Esta semana' : 'Este mes';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-boli-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Rango selector */}
      <div className="flex gap-2">
        {(['hoy', 'semana', 'mes'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRango(r)}
            className={`px-4 py-2 rounded-xl font-display font-semibold text-sm transition-all ${
              rango === r
                ? 'bg-boli-orange text-white shadow-md'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {r === 'hoy' ? 'Hoy' : r === 'semana' ? '7 días' : '30 días'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Ventas', value: `$${totalVentas.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Pedidos', value: totalPedidos, icon: ShoppingBag, color: 'text-boli-orange', bg: 'bg-orange-50' },
          { label: 'Visitas', value: totalVisitas, icon: Eye, color: 'text-boli-blue', bg: 'bg-blue-50' },
          { label: 'Ticket prom.', value: `$${ticketPromedio}`, icon: TrendingUp, color: 'text-boli-purple', bg: 'bg-purple-50' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center mb-2`}>
              <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
            </div>
            <p className="font-display font-bold text-xl text-gray-800">{kpi.value}</p>
            <p className="text-xs text-gray-400 font-semibold">{kpi.label} · {rangoLabel}</p>
          </motion.div>
        ))}
      </div>

      {/* Sabores más pedidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
      >
        <h3 className="font-display font-bold text-sm text-gray-800 mb-3">
          🏆 Sabores más pedidos
        </h3>
        {topSabores.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topSabores} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nombre"
                width={100}
                tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`${value} bolis`, 'Pedidos']}
              />
              <Bar dataKey="cantidad" radius={[0, 8, 8, 0]}>
                {topSabores.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">Aún no hay pedidos registrados</p>
        )}
      </motion.div>

      {/* Tráfico por hora */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
      >
        <h3 className="font-display font-bold text-sm text-gray-800 mb-3">
          ⏰ Tráfico por hora
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={traficoHoras} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis dataKey="hora" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <defs>
              <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="visitas" stroke="#4FC3F7" strokeWidth={2} fill="url(#colorVisitas)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Ventas por día + Tipo de entrega */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ventas por día */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
        >
          <h3 className="font-display font-bold text-sm text-gray-800 mb-3">
            💰 Ventas por día
          </h3>
          {ventasPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={ventasPorDia} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`$${value}`, 'Ventas']}
                />
                <Bar dataKey="total" fill="#FF8C00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">Sin ventas aún</p>
          )}
        </motion.div>

        {/* Tipo de entrega */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
        >
          <h3 className="font-display font-bold text-sm text-gray-800 mb-3">
            🚗 Tipo de entrega
          </h3>
          {entregaData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={entregaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    <Cell fill="#FF8C00" />
                    <Cell fill="#4FC3F7" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value, name) => [`${value} pedidos`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">Sin datos aún</p>
          )}
          {entregaData.length > 0 && (
            <div className="flex justify-center gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-boli-orange" /> Recoger
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-boli-blue" /> Domicilio
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Últimos pedidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
      >
        <h3 className="font-display font-bold text-sm text-gray-800 mb-3">
          📋 Últimos pedidos
        </h3>
        {pedidos.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pedidos.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">
                    {Array.isArray(p.items) ? p.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ') : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(p.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {p.tipo_entrega === 'recoger' ? '📍 Recoger' : '🚗 Domicilio'}
                  </p>
                </div>
                <span className="font-display font-bold text-sm text-green-600 ml-3">
                  ${Number(p.total)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">
            Aquí aparecerán los pedidos que hagan tus clientes
          </p>
        )}
      </motion.div>
    </div>
  );
}
