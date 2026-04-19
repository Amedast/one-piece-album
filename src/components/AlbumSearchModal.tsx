"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCards } from "@/lib/api";
import { Card, SlotState } from "@/types";
import { useAlbum } from "@/context/AlbumContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  CheckCircle2,
  Bookmark,
  Wand2,
  Image as ImageIcon,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import CardComponent from "./CardComponent";

interface AlbumSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (card: Card, state: SlotState, language: "JP" | "EN") => void;
  defaultState?: SlotState;
}

const RARITIES = ["L", "SR", "SEC", "SP CARD", "R", "UC", "C"];
const ALL_TYPES = ["LEADER", "CHARACTER", "EVENT", "STAGE"];

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
  const [query, setQuery] = useState("");
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<SlotState>(defaultState);
  const [selectedLanguage, setSelectedLanguage] = useState<"JP" | "EN">("EN");

  // Filtered custom cards
  const filteredCustom = customCards.filter(
    (c) =>
      query.trim() === "" || c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const loadCards = useCallback(async () => {
    if (tab !== "api") return;
    setIsLoading(true);
    try {
      const res = await fetchCards({
        page: 0,
        name: query || undefined,
        rarity: selectedRarities.length > 0 ? selectedRarities : undefined,
        showReprints: true,
      });
      setCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedRarities, tab]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(loadCards, 400);
    return () => clearTimeout(timer);
  }, [isOpen, loadCards]);

  useEffect(() => {
    if (isOpen) setSelectedState(defaultState);
  }, [isOpen, defaultState]);

  const toggleRarity = (r: string) => {
    setSelectedRarities((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };

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
          className="relative w-full max-w-4xl bg-leather border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black flex flex-col h-[85vh]"
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
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                      : "bg-leather-light border-white/10 text-zinc-400 hover:border-purple-500/30",
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

            {/* Search + rarity filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  placeholder={
                    tab === "api" ? "Buscar carta..." : "Buscar en custom..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-obsidian border border-white/10 focus:border-gold/40 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors font-crimson"
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
                <div className="flex gap-2 flex-wrap">
                  {RARITIES.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleRarity(r)}
                      className={twMerge(
                        "cursor-pointer px-3 py-1 rounded-lg border text-[10px] font-black uppercase transition-all",
                        selectedRarities.includes(r)
                          ? "bg-gold text-obsidian border-gold"
                          : "bg-leather-light border-white/10 text-zinc-500 hover:border-white/20",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
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
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {displayCards.map((card) => {
                  const cardState = getCardState(card.id);

                  return (
                    <div key={card.id}>
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
