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
import { useInView } from "react-intersection-observer";

const FILTERS_STORAGE_KEY = "ohara_filters_cache";

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [showAltArtsOnly, setShowAltArtsOnly] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
  });

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

  const loadCards = useCallback(
    async (isMore = false) => {
      if (isMore) setIsFetchingMore(true);
      else setIsLoading(true);

      const currentPage = isMore ? page + 1 : 0;

      try {
        const payload: GetCardsPayload = {
          page: currentPage,
          name: searchQuery || undefined,
          type: selectedTypes.length > 0 ? selectedTypes : undefined,
          rarity: selectedRarities.length > 0 ? selectedRarities : undefined,
          color: selectedColors.length > 0 ? selectedColors : undefined,
          card_set: selectedSets.length > 0 ? selectedSets : undefined,
          showReprints: false,
          showAltArts: showAltArtsOnly ? "only" : "show",
        };
        const res = await fetchCards(payload);

        if (isMore) {
          setCards((prev) => [...prev, ...res.data]);
          setPage(currentPage);
        } else {
          setCards(res.data);
          setPage(0);
        }

        // Each page has 20 cards usually. If we get less than 20, there are no more cards.
        // Also check if total results is reached if available
        setHasMore(res.data.length >= 20);
      } catch (err) {
        console.error("Failed to fetch cards:", err);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [
      page,
      searchQuery,
      selectedTypes,
      selectedRarities,
      selectedColors,
      selectedSets,
      showAltArtsOnly,
    ],
  );

  useEffect(() => {
    const t = setTimeout(() => loadCards(false), 450);
    return () => clearTimeout(t);
  }, [
    searchQuery,
    selectedTypes,
    selectedRarities,
    selectedColors,
    selectedSets,
    showAltArtsOnly,
  ]);

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isFetchingMore) {
      loadCards(true);
    }
  }, [inView, hasMore, isLoading, isFetchingMore, loadCards]);

  // Load filters from sessionStorage on mount
  useEffect(() => {
    const cached = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
        if (parsed.selectedTypes) setSelectedTypes(parsed.selectedTypes);
        if (parsed.selectedRarities) setSelectedRarities(parsed.selectedRarities);
        if (parsed.selectedColors) setSelectedColors(parsed.selectedColors);
        if (parsed.selectedSets) setSelectedSets(parsed.selectedSets);
        if (parsed.showAltArtsOnly !== undefined)
          setShowAltArtsOnly(parsed.showAltArtsOnly);
      } catch (e) {
        console.error("Error parsing cached filters", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return;

    const filters = {
      searchQuery,
      selectedTypes,
      selectedRarities,
      selectedColors,
      selectedSets,
      showAltArtsOnly,
    };
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [
    searchQuery,
    selectedTypes,
    selectedRarities,
    selectedColors,
    selectedSets,
    showAltArtsOnly,
    isInitialized,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedRarities([]);
    setSelectedColors([]);
    setSelectedSets([]);
    setShowAltArtsOnly(false);
    setPage(0);
    sessionStorage.removeItem(FILTERS_STORAGE_KEY);
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
            selectedSets={selectedSets}
            setSelectedSets={(s) => {
              setSelectedSets(s);
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-5 md:gap-6">
              {[...Array(32)].map((_, i) => (
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
                    key={`${card.id}-${i}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 20) * 0.03, duration: 0.3 }}
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

              {/* Infinite Scroll Trigger & Loader */}
              <div ref={ref} className="mt-12 py-8 flex justify-center w-full">
                {isFetchingMore && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-5 md:gap-6">
                    {[...Array(32)].map((_, i) => (
                      <div
                        key={i}
                        className="aspect-63/88 rounded-xl bg-leather-light animate-pulse"
                        style={{ animationDelay: `${i * 0.06}s` }}
                      />
                    ))}
                  </div>
                )}
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
