'use client';

import { motion } from 'framer-motion';

function SkeletonCard() {
  return (
    <div className="rounded-3xl overflow-hidden bg-gray-100 border border-gray-100">
      <div className="w-full aspect-square bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded-lg w-full animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded-lg w-12 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-2xl w-24 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonGrid() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 gap-3 sm:gap-4"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </motion.div>
  );
}
