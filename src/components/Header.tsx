'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { getGreeting, getCustomerName } from '@/lib/customer';

export default function Header() {
  const [greeting, setGreeting] = useState('Hechos con cariño ❄️ 100% Caseros');

  useEffect(() => {
    const name = getCustomerName();
    setGreeting(getGreeting(name || undefined));
  }, []);

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-boli-yellow via-amber-300 to-boli-orange pt-8 pb-10 px-4">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute top-4 left-8 w-6 h-6 rounded-full bg-white/20" />
      <div className="absolute bottom-12 right-12 w-4 h-4 rounded-full bg-white/25" />

      <div className="relative z-10 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white text-shadow-lg tracking-tight">
            🍦 Boly&apos;s
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-white/90 font-semibold text-lg"
        >
          Bolis artesanales · San Bartolo Tutotepec
        </motion.p>

        <motion.p
          key={greeting}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-1 text-white/70 text-sm font-medium"
        >
          {greeting}
        </motion.p>

        <motion.a
          href="https://maps.google.com/?q=20.397146,-98.199482"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white/90 text-xs font-semibold px-4 py-2 rounded-full"
        >
          <MapPin className="w-3.5 h-3.5" />
          Col. Los Reyes, C. Sor Juana Inés de la Cruz #4
        </motion.a>
      </div>

      <motion.a
        href="https://maps.google.com/?q=20.397146,-98.199482"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-2.5 shadow-lg"
      >
        <MapPin className="w-5 h-5 text-boli-orange" />
      </motion.a>

      <div className="absolute -bottom-1 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60V20C240 0 480 40 720 30C960 20 1200 0 1440 20V60H0Z" fill="white" />
        </svg>
      </div>
    </header>
  );
}
