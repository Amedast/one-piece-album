"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCards } from "@/lib/api";
import { Card, GetCardsPayload, SlotState } from "@/types";
import { useAlbum } from "@/context/AlbumContext";
import CardComponent from "@/components/CardComponent";
import FilterSystem from "@/components/FilterSystem";
import CardDetailsModal from "@/components/CardDetailsModal";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Compass, Loader2 } from "lucide-react";

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showAltArtsOnly, setShowAltArtsOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const { album } = useAlbum();

  const getCardState = useCallback(
    (cardId: string | number): SlotState => {
      if (!album?.pages) return "EMPTY";
      let state: SlotState = "EMPTY";
      for (const p of album.pages) {
        for (const slot of p.slots) {
          if (String(slot.cardId) === String(cardId)) {
            if (slot.state === "OWNED") return "OWNED";
            if (slot.state === "WISHLIST") state = "WISHLIST";
          }
        }
      }
      return state;
    },
    [album],
  );

  const loadCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload: GetCardsPayload = {
        page,
        name: searchQuery || undefined,
        type: selectedTypes.length > 0 ? selectedTypes : undefined,
        rarity: selectedRarities.length > 0 ? selectedRarities : undefined,
        color: selectedColors.length > 0 ? selectedColors : undefined,
        showReprints: true,
        showAltArts: showAltArtsOnly ? "only" : "show",
      };
      const res = await fetchCards(payload);
      setCards(res.data);
    } catch (err) {
      console.error("Failed to fetch cards:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    searchQuery,
    selectedTypes,
    selectedRarities,
    selectedColors,
    showAltArtsOnly,
  ]);

  useEffect(() => {
    const t = setTimeout(() => loadCards(), 450);
    return () => clearTimeout(t);
  }, [loadCards]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedRarities([]);
    setSelectedColors([]);
    setShowAltArtsOnly(false);
    setPage(0);
  };

  return (
    <main className="min-h-screen pt-20 pb-20">
      <div className="max-w-[1600px] mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="pt-10 pb-12">
          <h1 className="font-cinzel text-6xl md:text-8xl font-black text-white leading-none mb-4 text-center">
            Ohara <span className="text-shimmer">Database</span>
          </h1>
        </div>

        {/* Sticky filters */}
        <div className="sticky top-16 z-40 py-4 bg-obsidian/90 backdrop-blur-xl border-b border-white/5 -mx-5 md:-mx-10 px-5 md:px-10 mb-10">
          <FilterSystem
            searchQuery={searchQuery}
            setSearchQuery={(q) => {
              setSearchQuery(q);
              setPage(0);
            }}
            selectedTypes={selectedTypes}
            setSelectedTypes={(t) => {
              setSelectedTypes(t);
              setPage(0);
            }}
            selectedRarities={selectedRarities}
            setSelectedRarities={(r) => {
              setSelectedRarities(r);
              setPage(0);
            }}
            selectedColors={selectedColors}
            setSelectedColors={(c) => {
              setSelectedColors(c);
              setPage(0);
            }}
            showAltArtsOnly={showAltArtsOnly}
            setShowAltArtsOnly={(b) => {
              setShowAltArtsOnly(b);
              setPage(0);
            }}
            onReset={resetFilters}
          />
        </div>

        {/* Card Grid */}
        <div className="relative min-h-125">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 md:gap-6">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-63/88 rounded-xl bg-leather-light animate-pulse"
                  style={{ animationDelay: `${i * 0.06}s` }}
                />
              ))}
            </div>
          ) : cards.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-5 md:gap-6">
                {cards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    onClick={() => setSelectedCard(card)}
                    className="cursor-pointer"
                  >
                    <CardComponent
                      card={card}
                      slotState={getCardState(card.id)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-16 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="cursor-pointer group flex items-center gap-2 px-5 py-3 bg-leather border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft
                    size={18}
                    className="group-hover:-translate-x-0.5 transition-transform"
                  />
                  <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
                    Anterior
                  </span>
                </button>

                <div className="bg-leather border border-white/8 px-8 py-3 rounded-2xl text-center min-w-30">
                  <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-0.5">
                    Página
                  </div>
                  <div className="font-cinzel text-xl font-bold text-white">
                    {page + 1}
                  </div>
                </div>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={cards.length < 20}
                  className="cursor-pointer group flex items-center gap-2 px-5 py-3 bg-leather border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
                    Siguiente
                  </span>
                  <ChevronRight
                    size={18}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-28 border-2 border-dashed border-white/6 rounded-3xl">
              <p className="font-cinzel text-zinc-600 font-bold uppercase tracking-widest text-sm mb-3">
                No se encontraron cartas
              </p>
              <button
                onClick={resetFilters}
                className="cursor-pointer text-xs text-zinc-500 hover:text-gold transition-colors font-bold underline underline-offset-4"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Details Modal */}
      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </main>
  );
}
