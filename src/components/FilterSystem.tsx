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

interface FilterSystemProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (t: string[]) => void;
  selectedRarities: string[];
  setSelectedRarities: (r: string[]) => void;
  selectedColors: string[];
  setSelectedColors: (c: string[]) => void;
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
  showAltArtsOnly,
  setShowAltArtsOnly,
  onReset,
}: FilterSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const activeCount =
    selectedTypes.length +
    selectedRarities.length +
    selectedColors.length +
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
          placeholder="Buscar cartas piratas..."
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
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] md:w-[520px] bg-leather border border-white/10 rounded-3xl shadow-2xl shadow-black/60 z-50 p-7 overflow-hidden"
              >
                {/* Filter header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-cinzel text-lg font-bold text-white">
                    Refinar Búsqueda
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
                      <div className="text-[10px] opacity-60 font-crimson">
                        Variaciones artísticas exclusivas
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
      {active && <Check size={10} className="text-gold" />}
      {label}
    </button>
  );
}
