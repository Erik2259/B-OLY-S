'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError('Correo o contraseña incorrectos');
      setLoading(false);
      return;
    }

    router.push('/admin');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-boli-yellow/20 via-white to-boli-blue/10 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <span className="text-5xl">🍦</span>
          <h1 className="font-display text-3xl font-bold text-gray-800 mt-3">
            Admin Boly&apos;s
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">
            Inicia sesión para gestionar el menú
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-boli p-6 space-y-4 border border-gray-100"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-display font-semibold text-gray-600">
              Correo
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="mama@bolys.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-display font-semibold text-gray-600">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-boli-yellow to-boli-orange text-white font-display font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
