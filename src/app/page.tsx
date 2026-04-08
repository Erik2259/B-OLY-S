'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CartProvider } from '@/lib/cart-context';
import type { Sabor, Categoria } from '@/types';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import ProductCard from '@/components/ProductCard';
import CartButton from '@/components/CartButton';
import CartDrawer from '@/components/CartDrawer';

export default function MenuPage() {
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [categoria, setCategoria] = useState<Categoria>('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSabores = async () => {
      try {
        const { data, error: err } = await supabase
          .from('sabores')
          .select('*')
          .eq('disponible', true)
          .order('orden', { ascending: true });

        if (err) throw err;
        setSabores(data || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSabores();

    // Registrar visita
    supabase.from('visitas').insert({ page: '/' }).then(() => {});
  }, []);

  const filtered =
    categoria === 'Todos'
      ? sabores
      : sabores.filter((s) => s.categoria === categoria);

  return (
    <CartProvider>
      <main className="min-h-screen bg-white bg-mesh">
        <Header />

        {/* Sticky category bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-2">
          <CategoryFilter active={categoria} onChange={setCategoria} />
        </div>

        {/* Content */}
        <section className="max-w-2xl mx-auto px-4 pt-4 pb-28">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-boli-orange animate-spin" />
              <p className="text-gray-400 font-display font-semibold">
                Cargando sabores...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <WifiOff className="w-10 h-10 text-gray-300" />
              <p className="text-gray-400 font-display font-semibold text-center">
                No pudimos cargar el menú.
                <br />
                <span className="text-sm">Revisa tu conexión e intenta de nuevo.</span>
              </p>
            </div>
          ) : (
            <>
              <motion.p
                key={categoria}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-400 text-sm font-semibold mb-4"
              >
                {filtered.length} sabor{filtered.length !== 1 && 'es'} disponible
                {filtered.length !== 1 && 's'}
              </motion.p>

              <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((sabor, i) => (
                    <ProductCard key={sabor.id} sabor={sabor} index={i} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {filtered.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <span className="text-5xl">🤷</span>
                  <p className="text-gray-400 font-display font-semibold mt-4">
                    No hay sabores en esta categoría
                  </p>
                </motion.div>
              )}
            </>
          )}
        </section>

        {/* Cart components */}
        <CartButton />
        <CartDrawer />
      </main>
    </CartProvider>
  );
}
