"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Users, BookOpen, Heart, Loader2, Search } from "lucide-react";

type Collector = {
  userId: string;
  name: string;
  username: string;
  image: string | null;
  ownedCount: number;
  wishlistCount: number;
  updatedAt: string;
};

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/albums")
      .then((r) => r.json())
      .then((data) => setCollectors(data.collectors ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = collectors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="min-h-screen pt-20 pb-20">
      <div className="max-w-300 mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="pt-10 pb-12 text-center">
          <h1 className="font-cinzel text-5xl md:text-7xl font-black text-white leading-none mb-4">
            <span className="text-shimmer">Nakama</span> Collectors
          </h1>
          <p className="text-zinc-500 font-crimson text-lg max-w-lg mx-auto">
            Explora las colecciones de otros nakamas del mundo de One Piece TCG
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-sm mx-auto">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
          />
          <input
            type="text"
            placeholder="Buscar collector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-leather border border-white/8 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="text-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-white/6 rounded-3xl">
            <Users size={40} className="text-zinc-700 mx-auto mb-4" />
            <p className="font-cinzel text-zinc-600 font-bold uppercase tracking-widest text-sm mb-2">
              {search
                ? "No se encontraron collectors"
                : "Aún no hay collectors públicos"}
            </p>
            <p className="text-zinc-700 text-xs font-crimson">
              {search
                ? "Prueba con otro nombre de usuario"
                : "¡Sé el primero en compartir tu álbum!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <motion.div
                  key={c.userId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Link href={`/album/${c.username}`}>
                    <div className="group bg-leather border border-white/6 rounded-2xl p-6 hover:border-gold/25 hover:bg-leather-light transition-all duration-200 cursor-pointer">
                      {/* Avatar + info */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:border-gold/40 transition-colors">
                          <span className="font-cinzel font-black text-gold text-lg">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">
                            {c.name}
                          </p>
                          <p className="text-zinc-500 text-xs font-mono">
                            @{c.username}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-3">
                        <div className="flex-1 bg-obsidian/60 rounded-xl px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <BookOpen size={11} className="text-gold" />
                            <span className="font-cinzel font-black text-gold text-base">
                              {c.ownedCount}
                            </span>
                          </div>
                          <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">
                            Cartas
                          </p>
                        </div>
                        <div className="flex-1 bg-obsidian/60 rounded-xl px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Heart size={11} className="text-zinc-500" />
                            <span className="font-cinzel font-black text-zinc-400 text-base">
                              {c.wishlistCount}
                            </span>
                          </div>
                          <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">
                            Wishlist
                          </p>
                        </div>
                      </div>

                      {/* Updated */}
                      <p className="text-[10px] text-zinc-700 mt-3 text-right font-mono">
                        {new Date(c.updatedAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
