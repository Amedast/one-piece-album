"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCards } from "@/lib/api";
import { Card, SlotState, SetData } from "@/types";
import { useAlbum } from "@/context/AlbumContext";
import { loadSets } from "@/lib/sets";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  CheckCircle2,
  Bookmark,
  Wand2,
  Image as ImageIcon,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { twMerge } from "tailwind-merge";
import CardComponent from "./CardComponent";

const FILTERS_STORAGE_KEY = "ohara_filters_cache";

interface AlbumSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (card: Card, state: SlotState, language: "JP" | "EN") => void;
  defaultState?: SlotState;
}

const ALL_RARITIES = ["L", "C", "UC", "R", "SR", "SEC", "P", "SP CARD"];
const ALL_TYPES = ["LEADER", "CHARACTER", "EVENT", "STAGE"];
const ALL_COLORS = [
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Purple",
  "Black",
  "Multi-Color",
];

type TabType = "api" | "custom";

export default function AlbumSearchModal({
  isOpen,
  onClose,
  onSelect,
  defaultState = "OWNED",
}: AlbumSearchModalProps) {
  const { customCards, album } = useAlbum();

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

  const [tab, setTab] = useState<TabType>("api");
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [showAltArtsOnly, setShowAltArtsOnly] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedState, setSelectedState] = useState<SlotState>(defaultState);
  const [selectedLanguage, setSelectedLanguage] = useState<"JP" | "EN">("EN");
  const [sets, setSets] = useState<SetData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [setSearch, setSetSearch] = useState("");

  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  useEffect(() => {
    if (isOpen) {
      loadSets().then(setSets);
    }
  }, [isOpen]);

  // Filtered custom cards
  const filteredCustom = customCards.filter(
    (c) =>
      query.trim() === "" || c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const loadCards = useCallback(
    async (isMore = false) => {
      if (tab !== "api") return;
      if (isMore) setIsFetchingMore(true);
      else setIsLoading(true);

      const currentPage = isMore ? page + 1 : 0;

      try {
        const res = await fetchCards({
          page: currentPage,
          name: query || undefined,
          type: selectedTypes.length > 0 ? selectedTypes : undefined,
          rarity: selectedRarities.length > 0 ? selectedRarities : undefined,
          color: selectedColors.length > 0 ? selectedColors : undefined,
          card_set: selectedSets.length > 0 ? selectedSets : undefined,
          showReprints: false,
          showAltArts: showAltArtsOnly ? "only" : "show",
        });

        if (isMore) {
          setCards((prev) => [...prev, ...res.data]);
          setPage(currentPage);
        } else {
          setCards(res.data);
          setPage(0);
        }

        setHasMore(res.data.length >= 20);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [
      query,
      selectedTypes,
      selectedRarities,
      selectedColors,
      selectedSets,
      showAltArtsOnly,
      tab,
      page,
    ],
  );

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isFetchingMore && tab === "api") {
      loadCards(true);
    }
  }, [inView, hasMore, isLoading, isFetchingMore, loadCards, tab]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => loadCards(false), 400);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    query,
    selectedTypes,
    selectedRarities,
    selectedColors,
    selectedSets,
    showAltArtsOnly,
    tab,
  ]);

  // Load filters from sessionStorage on mount
  useEffect(() => {
    const cached = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.searchQuery !== undefined) setQuery(parsed.searchQuery);
        if (parsed.selectedTypes) setSelectedTypes(parsed.selectedTypes);
        if (parsed.selectedRarities)
          setSelectedRarities(parsed.selectedRarities);
        if (parsed.selectedColors) setSelectedColors(parsed.selectedColors);
        if (parsed.selectedSets) setSelectedSets(parsed.selectedSets);
        if (parsed.showAltArtsOnly !== undefined)
          setShowAltArtsOnly(parsed.showAltArtsOnly);
        if (parsed.selectedState) setSelectedState(parsed.selectedState);
        if (parsed.selectedLanguage) setSelectedLanguage(parsed.selectedLanguage);
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
      searchQuery: query,
      selectedTypes,
      selectedRarities,
      selectedColors,
      selectedSets,
      showAltArtsOnly,
      selectedState,
      selectedLanguage,
    };
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [
    query,
    selectedTypes,
    selectedRarities,
    selectedColors,
    selectedSets,
    showAltArtsOnly,
    selectedState,
    selectedLanguage,
    isInitialized,
  ]);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      // Logic for first time open if needed
    }
  }, [isOpen, isInitialized]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const toggleRarity = (r: string) => {
    setSelectedRarities((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };

  const toggleColor = (c: string) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const toggleSet = (id: string) => {
    setSelectedSets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onReset = () => {
    setQuery("");
    setSelectedTypes([]);
    setSelectedRarities([]);
    setSelectedColors([]);
    setSelectedSets([]);
    setShowAltArtsOnly(false);
  };

  const filteredSets = sets.filter(
    (s) =>
      s.raw_title.toLowerCase().includes(setSearch.toLowerCase()) ||
      s.title_parts.label?.toLowerCase().includes(setSearch.toLowerCase()),
  );

  const displayCards = tab === "custom" ? filteredCustom : cards;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-4xl bg-leather border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black flex flex-col h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/8 space-y-4 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                  <Search size={20} className="text-gold" />
                </div>
                <div>
                  <h2 className="font-cinzel text-xl font-bold text-white">
                    Añadir Carta al Álbum
                  </h2>
                  <p className="text-zinc-500 text-xs font-crimson">
                    Selecciona una carta y su estado
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer p-2 bg-leather-light rounded-xl text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3">
              {/* State toggle */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 w-12">
                  Estado:
                </span>
                <button
                  onClick={() => setSelectedState("OWNED")}
                  className={twMerge(
                    "cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all",
                    selectedState === "OWNED"
                      ? "bg-gold text-obsidian border-gold"
                      : "bg-leather-light border-white/10 text-zinc-400 hover:border-gold/30",
                  )}
                >
                  <CheckCircle2 size={14} />
                  Poseída
                </button>
                <button
                  onClick={() => setSelectedState("WISHLIST")}
                  className={twMerge(
                    "cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all",
                    selectedState === "WISHLIST"
                      ? "bg-zinc-200 text-zinc-900 border-white"
                      : "bg-leather-light border-white/10 text-zinc-400 hover:border-white/20",
                  )}
                >
                  <Bookmark size={14} />
                  Wishlist
                </button>
              </div>

              {/* Language toggle */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 w-12">
                  Idioma:
                </span>
                <button
                  onClick={() => setSelectedLanguage("EN")}
                  className={twMerge(
                    "cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all",
                    selectedLanguage === "EN"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                      : "bg-leather-light border-white/10 text-zinc-400 hover:border-blue-500/30",
                  )}
                >
                  EN
                </button>
                <button
                  onClick={() => setSelectedLanguage("JP")}
                  className={twMerge(
                    "cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all",
                    selectedLanguage === "JP"
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                      : "bg-leather-light border-white/10 text-zinc-400 hover:border-purple-500/30",
                  )}
                >
                  JP
                </button>
              </div>
            </div>

            {/* Tabs source */}
            <div className="flex gap-2">
              <TabBtn
                active={tab === "api"}
                onClick={() => setTab("api")}
                icon={<Search size={14} />}
                label="Base de Datos"
              />
              <TabBtn
                active={tab === "custom"}
                onClick={() => setTab("custom")}
                icon={<Wand2 size={14} />}
                label={`Custom (${customCards.length})`}
              />
            </div>

            {/* Search + filters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 group">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder={
                      tab === "api" ? "Buscar carta..." : "Buscar en custom..."
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-obsidian border border-white/10 focus:border-gold/40 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors font-crimson"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {tab === "api" && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={twMerge(
                      "cursor-pointer flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border font-bold text-sm transition-all",
                      showFilters ||
                        selectedTypes.length +
                          selectedRarities.length +
                          selectedColors.length +
                          selectedSets.length >
                          0
                        ? "bg-gold text-obsidian border-gold shadow-lg shadow-gold/10"
                        : "bg-leather-light border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                    )}
                  >
                    <SlidersHorizontal size={14} />
                    <span className="hidden sm:inline font-black uppercase text-[10px] tracking-wider">
                      Filtros
                    </span>
                    {selectedTypes.length +
                      selectedRarities.length +
                      selectedColors.length +
                      selectedSets.length >
                      0 && (
                      <span className="flex items-center justify-center w-4 h-4 bg-obsidian text-gold rounded-full text-[8px] font-black">
                        {selectedTypes.length +
                          selectedRarities.length +
                          selectedColors.length +
                          selectedSets.length}
                      </span>
                    )}
                    <ChevronDown
                      size={12}
                      className={twMerge(
                        "transition-transform hidden sm:inline",
                        showFilters && "rotate-180",
                      )}
                    />
                  </button>
                )}
              </div>

              {tab === "api" && (
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-obsidian/30 rounded-2xl border border-white/5 max-h-[60vh] flex flex-col"
                    >
                      <div className="p-5 space-y-3 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between">
                          <h4 className="font-cinzel text-xs font-bold text-white uppercase tracking-widest">
                            Filtros
                          </h4>
                          <button
                            onClick={onReset}
                            className="cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase text-zinc-500 hover:text-gold transition-colors"
                          >
                            <RotateCcw size={12} /> Limpiar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FilterSection label="Tipo">
                            {ALL_TYPES.map((t) => (
                              <FilterPill
                                key={t}
                                label={t}
                                active={selectedTypes.includes(t)}
                                onClick={() => toggleType(t)}
                              />
                            ))}
                          </FilterSection>

                          <FilterSection label="Rareza">
                            {ALL_RARITIES.map((r) => (
                              <FilterPill
                                key={r}
                                label={r}
                                active={selectedRarities.includes(r)}
                                onClick={() => toggleRarity(r)}
                              />
                            ))}
                          </FilterSection>
                        </div>

                        <FilterSection label="Color">
                          {ALL_COLORS.map((c) => (
                            <FilterPill
                              key={c}
                              label={c}
                              active={selectedColors.includes(c)}
                              onClick={() => toggleColor(c)}
                            />
                          ))}
                        </FilterSection>

                        <FilterSection label="Sets / Colecciones">
                          <div className="w-full space-y-3">
                            <div className="relative">
                              <Search
                                size={12}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                              />
                              <input
                                type="text"
                                placeholder="Buscar set..."
                                value={setSearch}
                                onChange={(e) => setSetSearch(e.target.value)}
                                className="w-full bg-obsidian/50 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-700 outline-none focus:border-gold/30 transition-colors font-crimson"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar w-full">
                              {filteredSets.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => toggleSet(s.id)}
                                  className={twMerge(
                                    "cursor-pointer flex items-center gap-2 p-2 rounded-xl border text-[11px] text-left transition-all",
                                    selectedSets.includes(s.id)
                                      ? "bg-gold/10 border-gold/30 text-gold shadow-sm shadow-gold/5"
                                      : "bg-leather-light/50 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300",
                                  )}
                                >
                                  <div
                                    className={twMerge(
                                      "shrink-0 w-11 py-1 rounded bg-obsidian text-center font-black text-[10px]",
                                      selectedSets.includes(s.id)
                                        ? "text-gold"
                                        : "text-zinc-600",
                                    )}
                                  >
                                    {s.title_parts.label || "???"}
                                  </div>
                                  <span className="truncate font-bold tracking-tight">
                                    {s.title_parts.title}
                                  </span>
                                  {selectedSets.includes(s.id) && (
                                    <Check size={10} className="ml-auto" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </FilterSection>

                        {/* Alt arts */}
                        <div className="pt-2">
                          <button
                            onClick={() => setShowAltArtsOnly(!showAltArtsOnly)}
                            className={twMerge(
                              "cursor-pointer w-full p-3 rounded-xl border flex items-center justify-between transition-all",
                              showAltArtsOnly
                                ? "bg-gold/10 border-gold/40 text-gold"
                                : "bg-leather-light border-white/8 text-zinc-500 hover:border-white/15",
                            )}
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              Solo Alt Arts
                            </span>
                            {showAltArtsOnly && <Check size={14} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Cards grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-63/88 rounded-xl bg-leather-light animate-pulse"
                  />
                ))}
              </div>
            ) : displayCards.length > 0 ? (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {displayCards.map((card, i) => {
                    const cardState = getCardState(card.id);

                    return (
                      <div key={`${card.id}-${i}`}>
                        <CardComponent
                          card={card}
                          slotState={cardState}
                          onClick={() =>
                            onSelect(card, selectedState, selectedLanguage)
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Infinite Scroll Trigger & Loader */}
                {tab === "api" && (
                  <div
                    ref={ref}
                    className="mt-8 py-6 flex justify-center w-full"
                  >
                    {isFetchingMore && hasMore && (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={24} className="text-gold animate-spin" />
                        <p className="text-[9px] font-black uppercase text-gold/50 tracking-widest">
                          Cargando...
                        </p>
                      </div>
                    )}
                    {!hasMore && cards.length > 0 && (
                      <div className="text-zinc-700 text-[9px] font-black uppercase tracking-widest opacity-40">
                        Fin de resultados
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
                {tab === "custom" ? (
                  <Wand2 size={40} className="text-zinc-700" />
                ) : (
                  <Search size={40} className="text-zinc-700" />
                )}
                <p className="text-zinc-500 font-black uppercase tracking-widest text-xs text-center">
                  {tab === "custom"
                    ? "No tienes cartas custom"
                    : "Sin resultados"}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        "cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all",
        active
          ? "bg-leather-light border-gold/40 text-gold"
          : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterSection({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h4 className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-3">
        {label}
      </h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        "cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all",
        active
          ? "bg-leather-light border-gold/50 text-gold"
          : "bg-leather-light border-white/8 text-zinc-500 hover:border-white/15 hover:text-zinc-300",
      )}
    >
      {label}
    </button>
  );
}
