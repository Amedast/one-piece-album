"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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

// ─── Shared panel content ─────────────────────────────────────────────────────
function FilterPanelContent({
  selectedTypes,
  selectedRarities,
  selectedColors,
  selectedSets,
  showAltArtsOnly,
  toggleType,
  toggleRarity,
  toggleColor,
  toggleSet,
  setShowAltArtsOnly,
  onReset,
  onClose,
  isMobile,
  setSearch,
  setSetSearch,
  filteredSets,
}: {
  selectedTypes: string[];
  selectedRarities: string[];
  selectedColors: string[];
  selectedSets: string[];
  showAltArtsOnly: boolean;
  toggleType: (t: string) => void;
  toggleRarity: (r: string) => void;
  toggleColor: (c: string) => void;
  toggleSet: (id: string) => void;
  setShowAltArtsOnly: (b: boolean) => void;
  onReset?: () => void;
  onClose: () => void;
  isMobile: boolean;
  setSearch: string;
  setSetSearch: (v: string) => void;
  filteredSets: SetData[];
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={onClose}
              className="cursor-pointer text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <h3 className="font-cinzel text-lg font-bold text-white">Filtros</h3>
        </div>
        <button
          onClick={onReset}
          className="cursor-pointer flex items-center gap-1.5 text-xs font-black uppercase text-zinc-500 hover:text-gold transition-colors"
        >
          <RotateCcw size={13} /> Limpiar
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <FilterSection label="Sets / Colecciones">
          <div className="relative mb-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
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

        <div className="pt-4 border-t border-white/8">
          <button
            onClick={() => setShowAltArtsOnly(!showAltArtsOnly)}
            className={twMerge(
              "cursor-pointer w-full p-4 rounded-2xl border flex items-center justify-between transition-all",
              showAltArtsOnly
                ? "bg-gold/10 border-gold/40 text-gold"
                : "bg-leather-light border-white/8 text-zinc-500 hover:border-white/15",
            )}
          >
            <div className="text-xs font-black uppercase italic tracking-wider">
              Solo Alt Arts
            </div>
            {showAltArtsOnly && <Check size={18} />}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSets().then(setSets);
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isMobile]);

  // Lock body scroll when mobile modal is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

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

  const sharedProps = {
    selectedTypes,
    selectedRarities,
    selectedColors,
    selectedSets,
    showAltArtsOnly,
    toggleType,
    toggleRarity,
    toggleColor,
    toggleSet,
    setShowAltArtsOnly,
    onReset,
    onClose: () => setIsOpen(false),
    isMobile,
    setSearch,
    setSetSearch,
    filteredSets,
  };

  // Mobile modal rendered via portal so it escapes the sticky/backdrop-filter ancestor
  const mobilePortal =
    mounted && isMobile
      ? createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-[6px]"
                />

                {/* Static flex wrapper handles centering — NOT a motion element so Framer
                    Motion can't override the positioning transforms */}
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                  <motion.div
                    key="panel"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="w-full max-w-[480px] max-h-[82vh] flex flex-col bg-leather border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden pointer-events-auto"
                  >
                    <FilterPanelContent {...sharedProps} />
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div className="w-full flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      {/* Search bar */}
      <div className="relative w-full md:flex-1 group">
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

      {/* Filter toggle button */}
      <div className="relative w-full md:w-auto" ref={containerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={twMerge(
            "cursor-pointer flex items-center justify-center md:justify-start w-full md:w-auto gap-2.5 px-5 py-3 rounded-2xl border font-bold text-sm transition-all",
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

        {/* Mobile modal portal (only rendered when isMobile===true) */}
        {mobilePortal}

        {/* Desktop dropdown (only rendered when !isMobile) */}
        {!isMobile && (
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-[600px] bg-leather border border-white/10 rounded-3xl shadow-2xl shadow-black/60 z-50 overflow-hidden flex flex-col max-h-[85vh]"
              >
                <FilterPanelContent {...sharedProps} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
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
