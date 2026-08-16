"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchCards } from "@/lib/api";
import { Card, GetCardsPayload, SlotState } from "@/types";
import { useAlbum } from "@/context/AlbumContext";
import CardComponent from "@/components/CardComponent";
import FilterSystem from "@/components/FilterSystem";
import CardDetailsModal from "@/components/CardDetailsModal";
import CardSkeleton from "@/components/CardSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Compass, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";

const FILTERS_STORAGE_KEY = "ohara_filters_cache";
/** Number of cards returned per API page — used to detect end of results */
const PAGE_SIZE = 20;

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
  // Use a ref for page to avoid recreating loadCards on every page change
  const pageRef = useRef(0);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  const { album } = useAlbum();

  // Pre-compute a Map for O(1) card state lookup instead of O(n²) per-card iteration
  const cardStateMap = useMemo(() => {
    const map = new Map<string, SlotState>();
    if (!album?.pages) return map;
    for (const p of album.pages) {
      for (const s of p.slots) {
        if (s.cardId !== undefined) {
          const key = String(s.cardId);
          // OWNED takes priority over WISHLIST
          if (s.state === "OWNED" || !map.has(key)) {
            map.set(key, s.state);
          }
        }
      }
    }
    return map;
  }, [album]);

  const getCardState = useCallback(
    (cardId: string | number): SlotState =>
      cardStateMap.get(String(cardId)) ?? "EMPTY",
    [cardStateMap],
  );

  const loadCards = useCallback(
    async (isMore = false) => {
      const currentPage = isMore ? pageRef.current + 1 : 0;
      if (isMore) setIsFetchingMore(true);
      else setIsLoading(true);

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
          pageRef.current = currentPage;
        } else {
          setCards(res.data);
          pageRef.current = 0;
        }

        setHasMore(res.data.length >= PAGE_SIZE);
      } catch (err) {
        console.error("Failed to fetch cards:", err);
      } finally {
        // Reset only the flag that was set at the start
        if (isMore) setIsFetchingMore(false);
        else setIsLoading(false);
      }
    },
    [
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
        if (parsed.searchQuery !== undefined)
          setSearchQuery(parsed.searchQuery);
        if (parsed.selectedTypes) setSelectedTypes(parsed.selectedTypes);
        if (parsed.selectedRarities)
          setSelectedRarities(parsed.selectedRarities);
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
    pageRef.current = 0;
    sessionStorage.removeItem(FILTERS_STORAGE_KEY);
  };

  return (
    <main className="min-h-screen pt-20 pb-20">
      <div className="max-w-[1600px] mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="pt-10 pb-10">
          <h1 className="font-cinzel text-5xl md:text-6xl lg:text-[3.75rem] font-black text-white leading-none mb-3">
            Ohara <span className="text-gold">Database</span>
          </h1>
          <p className="text-zinc-500 font-crimson text-base leading-relaxed">
            Busca y filtra todas las cartas de One Piece TCG.
          </p>
        </div>

        {/* Filters */}
        <FilterSystem
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          selectedRarities={selectedRarities}
          setSelectedRarities={setSelectedRarities}
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          selectedSets={selectedSets}
          setSelectedSets={setSelectedSets}
          showAltArtsOnly={showAltArtsOnly}
          setShowAltArtsOnly={setShowAltArtsOnly}
          onReset={resetFilters}
        />

        {/* Card Grid */}
        <div className="relative min-h-125 mt-6 md:mt-2">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-5 md:gap-6">
              {[...Array(32)].map((_, i) => (
                <CardSkeleton key={i} />
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
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-28 border border-dashed border-white/8 rounded-2xl gap-5">
              <div className="w-12 h-12 rounded-xl bg-leather-light border border-white/8 flex items-center justify-center">
                <Compass size={20} className="text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="font-cinzel text-zinc-600 font-bold text-sm mb-1">
                  Sin resultados
                </p>
                <p className="text-zinc-700 font-crimson text-sm">
                  Ninguna carta coincide con los filtros actuales.
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="cursor-pointer text-xs text-zinc-500 hover:text-gold transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] font-semibold underline underline-offset-4"
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
