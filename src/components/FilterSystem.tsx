"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { SetData } from "@/types";
import { loadSets } from "@/lib/sets";

interface FilterSystemProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (t: string[]) => void;
  selectedRarities: string[];
  setSelectedRarities: (r: string[]) => void;
  selectedColors: string[];
  setSelectedColors: (c: string[]) => void;
  selectedSets: string[];
  setSelectedSets: (s: string[]) => void;
  showAltArtsOnly: boolean;
  setShowAltArtsOnly: (b: boolean) => void;
  onReset?: () => void;
}

const ALL_TYPES = ["LEADER", "EVENT", "CHARACTER", "STAGE"];
const ALL_RARITIES = ["L", "C", "UC", "R", "SR", "SEC", "P", "SP CARD"];
const ALL_COLORS = [
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Purple",
  "Black",
  "Multi-Color",
];

export default function FilterSystem({
  searchQuery,
  setSearchQuery,
  selectedTypes,
  setSelectedTypes,
  selectedRarities,
  setSelectedRarities,
  selectedColors,
  setSelectedColors,
  selectedSets,
  setSelectedSets,
  showAltArtsOnly,
  setShowAltArtsOnly,
  onReset,
}: FilterSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sets, setSets] = useState<SetData[]>([]);
  const [setSearch, setSetSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load sets on mount
    loadSets().then(setSets);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleType = (t: string) =>
    setSelectedTypes(
      selectedTypes.includes(t)
        ? selectedTypes.filter((x) => x !== t)
        : [...selectedTypes, t],
    );

  const toggleRarity = (r: string) =>
    setSelectedRarities(
      selectedRarities.includes(r)
        ? selectedRarities.filter((x) => x !== r)
        : [...selectedRarities, r],
    );

  const toggleColor = (c: string) =>
    setSelectedColors(
      selectedColors.includes(c)
        ? selectedColors.filter((x) => x !== c)
        : [...selectedColors, c],
    );

  const toggleSet = (id: string) =>
    setSelectedSets(
      selectedSets.includes(id)
        ? selectedSets.filter((x) => x !== id)
        : [...selectedSets, id],
    );

  const filteredSets = sets.filter(
    (s) =>
      s.raw_title.toLowerCase().includes(setSearch.toLowerCase()) ||
      s.title_parts.label?.toLowerCase().includes(setSearch.toLowerCase()),
  );

  const activeCount =
    selectedTypes.length +
    selectedRarities.length +
    selectedColors.length +
    selectedSets.length +
    (showAltArtsOnly ? 1 : 0);

  return (
    <div className="w-full flex flex-col md:flex-row gap-3 items-center">
      {/* Search bar */}
      <div className="relative flex-1 group">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors"
        />
        <input
          type="text"
          placeholder="Buscar cartas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-leather border border-white/10 focus:border-gold/40 rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder-zinc-600 outline-none transition-colors font-crimson"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter button */}
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={twMerge(
            "cursor-pointer flex items-center gap-2.5 px-5 py-3 rounded-2xl border font-bold text-sm transition-all",
            isOpen || activeCount > 0
              ? "bg-gold text-obsidian border-gold shadow-lg shadow-gold/10"
              : "bg-leather border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
          )}
        >
          <SlidersHorizontal size={16} />
          <span className="text-sm font-black">Filtros</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 bg-obsidian text-gold rounded-full text-[9px] font-black">
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={14}
            className={twMerge(
              "transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop (mobile) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] md:w-[600px] bg-leather border border-white/10 rounded-3xl shadow-2xl shadow-black/60 z-50 p-7 overflow-hidden flex flex-col max-h-[85vh]"
              >
                {/* Filter header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-cinzel text-lg font-bold text-white">
                    Filtros
                  </h3>
                  <button
                    onClick={() => {
                      onReset?.();
                    }}
                    className="cursor-pointer flex items-center gap-1.5 text-xs font-black uppercase text-zinc-500 hover:text-gold transition-colors"
                  >
                    <RotateCcw size={13} /> Limpiar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Types */}
                  <FilterSection label="Tipo de Carta">
                    {ALL_TYPES.map((t) => (
                      <FilterPill
                        key={t}
                        label={t}
                        active={selectedTypes.includes(t)}
                        onClick={() => toggleType(t)}
                      />
                    ))}
                  </FilterSection>

                  {/* Rarities */}
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

                {/* Colors */}
                <FilterSection label="Color" className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {ALL_COLORS.map((c) => (
                      <FilterPill
                        key={c}
                        label={c}
                        active={selectedColors.includes(c)}
                        onClick={() => toggleColor(c)}
                      />
                    ))}
                  </div>
                </FilterSection>

                {/* Sets Section */}
                <FilterSection
                  label="Sets / Colecciones"
                  className="mt-6 flex-1 flex flex-col min-h-0"
                >
                  <div className="relative mb-3 shrink-0">
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
                  <div className="overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-50 w-full">
                    {filteredSets.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => toggleSet(s.id)}
                        className={twMerge(
                          "cursor-pointer flex items-center gap-2 p-2 rounded-xl border text-[12px] text-left transition-all",
                          selectedSets.includes(s.id)
                            ? "bg-gold/10 border-gold/30 text-gold"
                            : "bg-leather-light/50 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300",
                        )}
                      >
                        <div
                          className={twMerge(
                            "shrink-0 w-12 py-1 rounded bg-obsidian text-center font-black",
                            selectedSets.includes(s.id)
                              ? "text-gold"
                              : "text-zinc-600",
                          )}
                        >
                          {s.title_parts.label || "???"}
                        </div>
                        <span className="truncate font-bold tracking-tight leading-tight">
                          {s.title_parts.title || s.raw_title}
                        </span>
                        {selectedSets.includes(s.id) && (
                          <Check size={10} className="ml-auto shrink-0" />
                        )}
                      </button>
                    ))}
                    {filteredSets.length === 0 && (
                      <div className="col-span-full py-4 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                        No se encontraron sets
                      </div>
                    )}
                  </div>
                </FilterSection>

                {/* Alt arts */}
                <div className="mt-6 pt-5 border-t border-white/8">
                  <button
                    onClick={() => setShowAltArtsOnly(!showAltArtsOnly)}
                    className={twMerge(
                      "cursor-pointer w-full p-4 rounded-2xl border flex items-center justify-between transition-all",
                      showAltArtsOnly
                        ? "bg-gold/10 border-gold/40 text-gold"
                        : "bg-leather-light border-white/8 text-zinc-500 hover:border-white/15",
                    )}
                  >
                    <div className="text-left">
                      <div className="text-xs font-black uppercase italic tracking-wider">
                        Solo Alt Arts
                      </div>
                    </div>
                    {showAltArtsOnly && <Check size={18} />}
                  </button>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="cursor-pointer w-full mt-5 py-3 bg-gold text-obsidian rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-gold-bright transition-colors font-cinzel"
                >
                  Aplicar Filtros
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
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
        "cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
        active
          ? "bg-leather-light border-gold/50 text-gold"
          : "bg-leather-light border-white/8 text-zinc-500 hover:border-white/15 hover:text-zinc-300",
      )}
    >
      {label}
    </button>
  );
}
