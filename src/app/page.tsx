'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CartProvider } from '@/lib/cart-context';
import type { Producto, Categoria, SubCategoria } from '@/types';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import SectionTabs from '@/components/SectionTabs';
import ProductCard from '@/components/ProductCard';
import TemporadaBanner from '@/components/TemporadaBanner';
import CartButton from '@/components/CartButton';
import CartDrawer from '@/components/CartDrawer';
import SkeletonGrid from '@/components/SkeletonGrid';
import Favorites from '@/components/Favorites';
import OrderHistory from '@/components/OrderHistory';
import CrossSell from '@/components/CrossSell';

export default function MenuPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [seccionActiva, setSeccionActiva] = useState<string>('bolis');
  const [subCategoria, setSubCategoria] = useState<SubCategoria>('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [topSellerIds, setTopSellerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('productos').select('*, categorias(*)').eq('disponible', true).order('orden', { ascending: true }),
          supabase.from('categorias').select('*').eq('activa', true).order('orden', { ascending: true }),
        ]);
        if (prodRes.error) throw prodRes.error;
        setProductos(prodRes.data || []);
        setCategorias(catRes.data || []);

        // Top sellers
        try {
          const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
          const { data: pedidos } = await supabase.from('pedidos').select('items').gte('created_at', since);
          if (pedidos && pedidos.length > 0) {
            const counts: Record<string, number> = {};
            pedidos.forEach((p) => {
              if (Array.isArray(p.items)) p.items.forEach((item: { sabor_id: string; cantidad: number }) => {
                counts[item.sabor_id] = (counts[item.sabor_id] || 0) + item.cantidad;
              });
            });
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            setTopSellerIds(new Set(sorted.slice(0, 3).map(([id]) => id)));
          }
        } catch {}
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    supabase.from('visitas').insert({ page: '/' }).then(() => {});
  }, []);

  const seccionCat = categorias.find((c) => c.slug === seccionActiva);
  const productoSeccion = productos.filter((p) => seccionCat && p.categoria_id === seccionCat.id);
  const filtered = seccionActiva === 'bolis'
    ? (subCategoria === 'Todos' ? productoSeccion : productoSeccion.filter((p) => p.categoria === subCategoria))
    : productoSeccion;

  const temporadaProductos = productos.filter((p) => {
    const cat = categorias.find((c) => c.id === p.categoria_id);
    return cat && cat.slug !== 'bolis';
  });

  return (
    <CartProvider>
      <main className="min-h-screen bg-white bg-mesh">
        <Header />

        {/* Section tabs */}
        {categorias.length > 1 && (
          <SectionTabs categorias={categorias} active={seccionActiva} onChange={(slug) => { setSeccionActiva(slug); setSubCategoria('Todos'); }} />
        )}

        {/* Sub-category filter (only for bolis) */}
        {seccionActiva === 'bolis' && (
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-2">
            <CategoryFilter active={subCategoria} onChange={setSubCategoria} />
          </div>
        )}

        <section className="max-w-2xl mx-auto px-4 pt-4 pb-28">
          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <WifiOff className="w-10 h-10 text-gray-300" />
              <p className="text-gray-400 font-display font-semibold text-center">
                No pudimos cargar el menú.<br /><span className="text-sm">Revisa tu conexión.</span>
              </p>
            </div>
          ) : (
            <>
              {seccionActiva === 'bolis' && <Favorites sabores={productos} />}

              <motion.p key={`${seccionActiva}-${subCategoria}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400 text-sm font-semibold mb-4">
                {filtered.length} producto{filtered.length !== 1 && 's'} disponible{filtered.length !== 1 && 's'}
              </motion.p>

              {/* Temporada: hero banner for featured products */}
              {seccionActiva !== 'bolis' && (
                <div className="space-y-4 mb-4">
                  {filtered.filter((p) => p.destacado).map((p, i) => (
                    <TemporadaBanner key={p.id} producto={p} index={i} />
                  ))}
                </div>
              )}

              <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4">
                <AnimatePresence mode="popLayout">
                  {(seccionActiva !== 'bolis' ? filtered.filter((p) => !p.destacado) : filtered).map((p, i) => (
                    <ProductCard key={p.id} sabor={p} index={i} isTopSeller={topSellerIds.has(p.id)} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {filtered.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <span className="text-5xl">❄️</span>
                  <p className="text-gray-400 font-display font-semibold mt-4">No hay productos aquí</p>
                  <p className="text-gray-300 text-sm mt-1">Revisa otra sección</p>
                </motion.div>
              )}

              {/* Cross-sell */}
              {seccionActiva === 'bolis' && temporadaProductos.length > 0 && (
                <CrossSell productos={temporadaProductos} onSwitchTab={() => { const tempCat = categorias.find(c => c.slug !== 'bolis'); if (tempCat) setSeccionActiva(tempCat.slug); }} />
              )}

              {seccionActiva === 'bolis' && <OrderHistory sabores={productos} />}
            </>
          )}
        </section>

        <CartButton />
        <CartDrawer categorias={categorias} />
      </main>
    </CartProvider>
  );
}
