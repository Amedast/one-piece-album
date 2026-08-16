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

// ─── Shared panel content (Used in Desktop Dropdown & Mobile Popup) ───────────
function FilterPanelContent({
  searchQuery,
  setSearchQuery,
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
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
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
      <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/8 shrink-0 bg-leather-light/30">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={onClose}
              className="cursor-pointer p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <h3 className="font-cinzel text-lg font-bold text-white leading-none">
            Filtros
          </h3>
        </div>
        <button
          onClick={onReset}
          className="cursor-pointer flex items-center gap-1.5 text-xs font-black uppercase text-zinc-400 hover:text-gold transition-colors"
        >
          <RotateCcw size={13} /> Limpiar
        </button>
      </div>

      {/* Mobile Search Bar (Inside modal when on mobile) */}
      {isMobile && setSearchQuery && (
        <div className="p-4 pb-2 border-b border-white/5 bg-obsidian/30 shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Buscar cartas por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-leather border border-white/10 focus:border-gold/40 rounded-xl py-2.5 pl-10 pr-9 text-xs text-white placeholder-zinc-600 outline-none transition-colors font-crimson"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-7 custom-scrollbar">
        {/* Tipo y Rareza (50% cada columna) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
          <FilterSection label="Tipo de Carta" className="min-w-0">
            {ALL_TYPES.map((t) => (
              <FilterPill
                key={t}
                label={t}
                active={selectedTypes.includes(t)}
                onClick={() => toggleType(t)}
              />
            ))}
          </FilterSection>
          <FilterSection label="Rareza" className="min-w-0">
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

        {/* Color */}
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

        {/* Sets / Colecciones (50% cada columna) */}
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
          <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar w-full">
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
                    "shrink-0 w-12 py-1 rounded bg-obsidian text-center font-black text-[10px]",
                    selectedSets.includes(s.id) ? "text-gold" : "text-zinc-600",
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

        {/* Solo Alt Arts */}
        <div className="pt-2 border-t border-white/8">
          <button
            onClick={() => setShowAltArtsOnly(!showAltArtsOnly)}
            className={twMerge(
              "cursor-pointer w-full p-4 mt-2 rounded-2xl border flex items-center justify-between transition-all",
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

      {/* Footer CTA for Mobile */}
      {isMobile && (
        <div className="p-4 border-t border-white/8 bg-leather-light/30 shrink-0">
          <button
            onClick={onClose}
            className="cursor-pointer w-full py-3 rounded-xl bg-gold hover:bg-gold-bright text-obsidian font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-gold/20 active:scale-95 text-center"
          >
            Ver Resultados
          </button>
        </div>
      )}
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
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sets, setSets] = useState<SetData[]>([]);
  const [setSearch, setSetSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSets().then(setSets);
    setMounted(true);
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  // Lock body scroll when mobile modal is open
  useEffect(() => {
    if (isMobileModalOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsMobileModalOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileModalOpen]);

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
    setSearch,
    setSetSearch,
    filteredSets,
  };

  // Mobile Modal (rendered to document.body when open)
  const mobileModalPortal =
    mounted && isMobileModalOpen
      ? createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-leather border border-white/10 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden z-10"
            >
              <FilterPanelContent
                {...sharedProps}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onClose={() => setIsMobileModalOpen(false)}
                isMobile={true}
              />
            </motion.div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {/* ── 1. Desktop: Sticky Filter Bar with Background & Shadow ── */}
      <div className="hidden md:block sticky top-16 z-40 py-3.5 -mx-5 md:-mx-10 px-5 md:px-10 mb-6 bg-obsidian/85 backdrop-blur-md border-b border-white/8 shadow-2xl shadow-black/80">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3">
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
              className="w-full bg-leather border border-white/10 focus:border-gold/40 rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder-zinc-600 outline-none transition-colors font-crimson shadow-lg shadow-black/40"
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
          <div className="relative shrink-0" ref={containerRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={twMerge(
                "cursor-pointer flex items-center gap-2.5 px-5 py-3 rounded-2xl border font-bold text-sm transition-all shadow-lg",
                isOpen || activeCount > 0
                  ? "bg-gold text-obsidian border-gold shadow-gold/20 hover:bg-gold-bright"
                  : "bg-leather border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200 shadow-black/40",
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

            {/* Desktop dropdown */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-[600px] bg-leather border border-white/10 rounded-3xl shadow-2xl shadow-black/80 z-50 overflow-hidden flex flex-col max-h-[80vh]"
                >
                  <FilterPanelContent
                    {...sharedProps}
                    onClose={() => setIsOpen(false)}
                    isMobile={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── 2. Mobile Floating Action Button (FAB) (Only on mobile < 768px) ── */}
      {isMobile && (
        <div
          className="fixed bottom-6 right-6 z-[999] md:hidden"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 999,
          }}
        >
          <button
            type="button"
            onClick={() => setIsMobileModalOpen(true)}
            className="cursor-pointer relative flex items-center justify-center w-14 h-14 rounded-full bg-gold text-obsidian border-2 border-amber-300 shadow-2xl shadow-black/90 active:scale-90 transition-transform"
            style={{
              backgroundColor: "#f4a018",
              color: "#0b0e13",
              width: "56px",
              height: "56px",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)",
              border: "2px solid #ffb938",
              cursor: "pointer",
            }}
            title="Filtros"
            aria-label="Filtros"
          >
            <SlidersHorizontal
              size={24}
              className="text-obsidian stroke-[2.5]"
              color="#0b0e13"
            />
            {activeCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-crimson text-white font-black text-[10px] border-2 border-leather shadow-md"
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  backgroundColor: "#c0392b",
                  color: "#ffffff",
                  width: "20px",
                  height: "20px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 900,
                }}
              >
                {activeCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── 3. Mobile Modal Portal ── */}
      {mobileModalPortal}
    </>
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
      <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-2.5">
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
      {active && <Check size={10} className="text-gold" />}
    </button>
  );
}
