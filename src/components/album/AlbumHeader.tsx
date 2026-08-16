"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlbum } from "@/context/AlbumContext";
import { useSession } from "@/lib/auth-client";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  GripVertical,
  Wand2,
  Settings,
  Check,
  Globe,
  Lock,
  Save,
  Columns,
  Square,
  Loader2,
  FolderPlus,
  Star,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

interface AlbumHeaderProps {
  currentPageIndex: number; // spread index (0-based)
  totalPages: number; // number of real album pages
  totalSpreads: number; // totalPages + 1
  isReorganizeMode: boolean;
  isSinglePageView: boolean;
  onToggleSinglePageView: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAddPage: () => void;
  onToggleReorganize: () => void;
  onOpenCustomCard: () => void;
  onOpenPageManager: () => void;
  onOpenCreateAlbum: () => void;
  onOpenAlbumSettings: () => void;
}

export default function AlbumHeader({
  currentPageIndex,
  totalPages,
  totalSpreads,
  isReorganizeMode,
  isSinglePageView,
  onToggleSinglePageView,
  onPrev,
  onNext,
  onAddPage,
  onToggleReorganize,
  onOpenCustomCard,
  onOpenPageManager,
  onOpenCreateAlbum,
  onOpenAlbumSettings,
}: AlbumHeaderProps) {
  const {
    album,
    albums,
    switchAlbum,
    totalOwned,
    totalWishlist,
    isPublic,
    togglePublic,
    hasUnsavedChanges,
    isSaving,
    saveError,
    saveAlbumToServer,
  } = useAlbum();
  const { data: session } = useSession();

  const [showAlbumDropdown, setShowAlbumDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowAlbumDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // currentPageIndex is the spread index (0-based) in double mode; or page index (0-based) in single mode
  const currentSpread = isSinglePageView
    ? currentPageIndex + 1
    : Math.floor(currentPageIndex / 2) + 1;

  // Visual spread count
  const displaySpreads = isSinglePageView
    ? totalPages + 2
    : Math.floor((totalPages + 2) / 2);

  const handleSave = async () => {
    if (!session?.user) {
      window.dispatchEvent(new Event("open-auth-modal"));
      return;
    }
    await saveAlbumToServer();
  };

  return (
    <div className="w-full mb-8 space-y-4">
      {/* Top row: Album Selector / Title + Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title & Album Switcher */}
        <div className="relative z-30" ref={dropdownRef}>
          <button
            onClick={() => setShowAlbumDropdown(!showAlbumDropdown)}
            className="cursor-pointer flex items-center gap-3 px-2.5 py-2.5 rounded-2xl bg-leather-light border border-white/10 hover:border-gold/30 hover:bg-leather-light/80 transition-all text-left group active:scale-[0.98]"
            title="Cambiar de álbum"
          >
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-gold" />
            </div>
            <div className="flex items-center gap-2 min-w-0 pr-1">
              <h1 className="font-cinzel text-base sm:text-lg font-bold text-white leading-tight truncate max-w-[200px] sm:max-w-[280px]">
                {album.title || "Mi Álbum"}
              </h1>
              <ChevronDown
                size={16}
                className={`text-zinc-400 group-hover:text-gold transition-transform duration-200 shrink-0 ${
                  showAlbumDropdown ? "rotate-180 text-gold" : ""
                }`}
              />
            </div>
          </button>

          {/* Album Switcher Dropdown (Solid opaque background, independent width) */}
          <AnimatePresence>
            {showAlbumDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                style={{ width: "380px", maxWidth: "calc(100vw - 2rem)" }}
                className="absolute left-0 top-full mt-2 bg-leather border border-white/10 rounded-2xl shadow-2xl shadow-black z-50 p-3 space-y-2"
              >
                <div className="px-2 py-1 text-[11px] font-black uppercase text-zinc-500 tracking-wider flex items-center justify-between">
                  <span>Tus Álbumes ({albums.length})</span>
                </div>

                <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                  {albums.map((item) => {
                    const isActive = item.id === album.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          switchAlbum(item.id);
                          setShowAlbumDropdown(false);
                        }}
                        className={`cursor-pointer w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-left transition-all active:scale-[0.99] ${
                          isActive
                            ? "bg-gold/10 border border-gold/35 text-gold"
                            : "bg-leather-light/60 hover:bg-leather-light text-zinc-300 border border-transparent"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm truncate text-white">
                              {item.title}
                            </span>
                            {item.isDefault && (
                              <Star size={12} className="text-gold fill-gold shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-crimson">
                            <span>{item.ownedCount ?? 0} cartas</span>
                            <span>·</span>
                            <span className={item.isPublic ? "text-emerald-400/90" : "text-zinc-500"}>
                              {item.isPublic ? "Público" : "Privado"}
                            </span>
                          </div>
                        </div>

                        {isActive && (
                          <Check size={16} className="text-gold shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-white/8 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setShowAlbumDropdown(false);
                      onOpenCreateAlbum();
                    }}
                    className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-bold text-gold hover:bg-gold/10 transition-colors w-full active:scale-[0.98] whitespace-nowrap"
                  >
                    <Plus size={16} className="shrink-0" />
                    <span>Crear Nuevo Álbum</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAlbumDropdown(false);
                      onOpenAlbumSettings();
                    }}
                    className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors w-full active:scale-[0.98] whitespace-nowrap"
                  >
                    <Settings size={15} className="shrink-0" />
                    <span>Ajustes de este álbum</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Create new album shortcut */}
          <motion.button
            onClick={onOpenCreateAlbum}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer p-2.5 bg-leather-light border border-white/10 hover:border-gold/30 rounded-xl text-zinc-400 hover:text-gold transition-all"
            title="Crear nuevo álbum"
          >
            <FolderPlus size={16} />
          </motion.button>

          {/* Layout toggle view */}
          <motion.button
            onClick={onToggleSinglePageView}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer p-2.5 bg-leather-light border border-white/10 hover:border-white/20 rounded-xl text-zinc-400 hover:text-white transition-all hidden md:flex"
            title={isSinglePageView ? "Ver dos páginas" : "Ver una página"}
          >
            {isSinglePageView ? <Columns size={16} /> : <Square size={16} />}
          </motion.button>

          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleSave}
            disabled={isSaving}
            whileTap={{ scale: 0.95 }}
            className={twMerge(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200 cursor-pointer",
              isSaving
                ? "bg-blue-500/10 border-blue-500/20 text-blue-300 opacity-70"
                : "bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30"
            )}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span className="text-xs font-bold">
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </span>
          </motion.button>

          {/* Reorganize toggle */}
          <motion.button
            onClick={onToggleReorganize}
            whileTap={{ scale: 0.95 }}
            className={twMerge(
              "cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200",
              isReorganizeMode
                ? "bg-gold text-obsidian border-gold shadow-lg shadow-gold/20"
                : "bg-leather-light border-white/10 text-zinc-300 hover:border-gold/40 hover:text-gold"
            )}
          >
            {isReorganizeMode ? (
              <Check size={16} />
            ) : (
              <GripVertical size={16} />
            )}
            <span className="text-xs font-medium">
              {isReorganizeMode ? "Listo" : "Reorganizar"}
            </span>
          </motion.button>

          {/* Add page */}
          <motion.button
            onClick={onAddPage}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-leather-light border border-white/10 hover:border-white/20 rounded-xl text-zinc-300 hover:text-white transition-all"
            title="Añadir página"
          >
            <Plus size={16} />
            <span className="text-xs font-medium hidden sm:inline">
              Página
            </span>
          </motion.button>

          {/* Custom card */}
          <motion.button
            onClick={onOpenCustomCard}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-leather-light border border-white/10 hover:border-purple-400/40 rounded-xl text-zinc-300 hover:text-purple-400 transition-all"
            title="Crear carta personalizada"
          >
            <Wand2 size={16} />
            <span className="text-xs font-medium hidden sm:inline">
              Custom
            </span>
          </motion.button>

          {/* Visibility toggle */}
          <motion.button
            onClick={togglePublic}
            whileTap={{ scale: 0.95 }}
            className={twMerge(
              "cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200",
              isPublic
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-leather-light border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
            )}
            title={isPublic ? "Tu álbum es público" : "Tu álbum es privado"}
          >
            {isPublic ? <Globe size={16} /> : <Lock size={16} />}
            <span className="text-xs font-medium hidden sm:inline">
              {isPublic ? "Público" : "Privado"}
            </span>
          </motion.button>

          {/* Page manager */}
          <motion.button
            onClick={onOpenPageManager}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer p-2.5 bg-leather-light border border-white/10 hover:border-white/20 rounded-xl text-zinc-400 hover:text-white transition-all"
            title="Gestionar páginas"
          >
            <Settings size={16} />
          </motion.button>
        </div>
      </div>

      {/* Save error banner */}
      {saveError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-red-400 text-xs font-bold">{saveError}</span>
        </div>
      )}

      {/* Navigation row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onPrev}
          disabled={currentPageIndex === 0}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-leather-light border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all group"
        >
          <ChevronLeft
            size={18}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          <span className="text-xs font-medium hidden sm:inline">
            Anterior
          </span>
        </button>

        <div className="md:block hidden">
          <div className="text-sm font-black text-white font-cinzel text-center mb-1">
            {currentSpread} / {displaySpreads}
          </div>
          <div className="flex items-center gap-3">
            {/* Page dots */}
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: displaySpreads }).map((_, i) => (
                <div
                  key={i}
                  className={twMerge(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentSpread - 1
                      ? "w-6 bg-gold"
                      : "w-1.5 bg-zinc-700 hover:bg-zinc-500 cursor-pointer"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={currentPageIndex + 2 >= totalSpreads}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-leather-light border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all group"
        >
          <span className="text-xs font-medium hidden sm:inline">
            Siguiente
          </span>
          <ChevronRight
            size={18}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>

      {/* Reorganize mode banner */}
      {isReorganizeMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gold/10 border border-gold/30 rounded-xl px-5 py-3 flex items-center gap-3"
        >
          <GripVertical size={16} className="text-gold shrink-0" />
          <p className="text-gold text-xs font-bold">
            <span className="font-black">Modo Reorganizar activo</span> —
            Arrastra las cartas para cambiar su posición en el álbum. Las cartas
            vacías actúan como destino de intercambio.
          </p>
        </motion.div>
      )}
    </div>
  );
}
