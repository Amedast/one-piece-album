'use client';

import { motion } from 'framer-motion';
import { useAlbum } from '@/context/AlbumContext';
import { BookMarked } from 'lucide-react';

export default function CollectionStats() {
  const { totalOwned, totalWishlist, album } = useAlbum();
  const totalSlots = album.pages.reduce((a, p) => a + p.slots.length, 0);
  const percentage = totalSlots > 0 ? Math.round((totalOwned / totalSlots) * 100) : 0;

  return (
    <div className="bg-leather border border-white/8 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookMarked size={16} className="text-gold" />
          <h2 className="font-cinzel text-sm font-bold text-white">Progreso del Álbum</h2>
        </div>
        <span className="font-cinzel text-2xl font-bold text-gold">{percentage}%</span>
      </div>
      <div className="h-2 bg-obsidian rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-linear-to-r from-gold-dim to-gold rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        <span>{totalOwned} poseídas · {totalWishlist} wishlist</span>
        <span>{totalSlots} slots total</span>
      </div>
    </div>
  );
}
