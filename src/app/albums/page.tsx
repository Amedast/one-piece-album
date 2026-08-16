"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Users, BookOpen, Heart, Loader2, Search } from "lucide-react";

type PublicAlbumItem = {
  albumId: string;
  title: string;
  description?: string;
  coverUrl?: string | null;
  userId: string;
  name: string;
  username: string;
  image: string | null;
  ownedCount: number;
  wishlistCount: number;
  totalPages?: number;
  updatedAt: string;
};

export default function CollectorsPage() {
  const [albums, setAlbums] = useState<PublicAlbumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/albums")
      .then((r) => r.json())
      .then((data) => setAlbums(data.albums ?? data.collectors ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = albums.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="min-h-screen pt-20 pb-20">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="pt-10 pb-12">
          <h1 className="font-cinzel text-5xl md:text-6xl lg:text-[3.75rem] font-black text-white leading-none mb-3">
            Nakama <span className="text-gold">Collectors</span>
          </h1>
          <p className="text-zinc-500 font-crimson text-base leading-relaxed max-w-2xl">
            Explora los álbumes y colecciones públicas de otros nakamas del mundo de One Piece TCG.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Buscar por álbum, usuario o nakama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-leather border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold/40 transition-colors shadow-inner"
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
                ? "No se encontraron álbumes ni collectors"
                : "Aún no hay álbumes públicos"}
            </p>
            <p className="text-zinc-700 text-xs font-crimson">
              {search
                ? "Prueba con otro término de búsqueda"
                : "¡Sé el primero en compartir tu álbum con la comunidad!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <motion.div
                  key={`${c.userId}-${c.albumId}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Link href={`/album/${c.username}?albumId=${c.albumId}`}>
                    <div className="group bg-leather border border-white/6 rounded-2xl p-6 hover:border-gold/30 hover:bg-leather-light transition-all duration-200 cursor-pointer flex flex-col justify-between h-full shadow-lg hover:shadow-gold/5">
                      {/* Album & Author info */}
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:border-gold/40 transition-colors">
                              <span className="font-cinzel font-black text-gold text-base">
                                {c.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs truncate">
                                {c.name}
                              </p>
                              <p className="text-zinc-500 text-[11px] font-mono truncate">
                                @{c.username}
                              </p>
                            </div>
                          </div>

                          <div className="px-2.5 py-1 rounded-lg bg-obsidian border border-white/5 text-[10px] font-bold text-gold shrink-0">
                            Álbum
                          </div>
                        </div>

                        {/* Title & description */}
                        <div className="mb-5">
                          <h3 className="font-cinzel text-lg font-bold text-white group-hover:text-gold transition-colors line-clamp-1">
                            {c.title}
                          </h3>
                          {c.description && (
                            <p className="text-xs text-zinc-400 font-crimson line-clamp-2 mt-1">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        {/* Stats */}
                        <div className="flex gap-3">
                          <div className="flex-1 bg-obsidian/60 rounded-xl px-3 py-2 text-center border border-white/5">
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              <BookOpen size={11} className="text-gold" />
                              <span className="font-cinzel font-black text-gold text-sm">
                                {c.ownedCount}
                              </span>
                            </div>
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                              Cartas
                            </p>
                          </div>
                          <div className="flex-1 bg-obsidian/60 rounded-xl px-3 py-2 text-center border border-white/5">
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              <Heart size={11} className="text-zinc-400" />
                              <span className="font-cinzel font-black text-zinc-300 text-sm">
                                {c.wishlistCount}
                              </span>
                            </div>
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                              Wishlist
                            </p>
                          </div>
                        </div>

                        {/* Updated */}
                        <p className="text-[10px] text-zinc-600 mt-3 text-right font-mono">
                          Actualizado:{" "}
                          {new Date(c.updatedAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
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
