"use client";

import { motion } from "framer-motion";
import { useAlbum } from "@/context/AlbumContext";
import { useSession } from "@/lib/auth-client";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
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
}: AlbumHeaderProps) {
  const {
    totalOwned,
    totalWishlist,
    isPublic,
    togglePublic,
    hasUnsavedChanges,
    isSaving,
    saveAlbumToServer,
  } = useAlbum();
  const { data: session } = useSession();

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
      {/* Top row: Title + Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-white leading-none">
              Mi Álbum
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
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
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer",
              isSaving
                ? "bg-blue-500/10 border-blue-500/20 text-blue-300 opacity-70"
                : "bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30",
            )}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} className="animate-pulse" />
            )}
            <span className="text-xs uppercase tracking-wider font-black">
              {isSaving ? "Guardando..." : "Guardar Cambios"}
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
                : "bg-leather-light border-white/10 text-zinc-300 hover:border-gold/40 hover:text-gold",
            )}
          >
            {isReorganizeMode ? (
              <Check size={16} />
            ) : (
              <GripVertical size={16} />
            )}
            <span className="text-xs uppercase tracking-wider font-black">
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
            <span className="text-xs uppercase tracking-wider font-black hidden sm:inline">
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
            <span className="text-xs uppercase tracking-wider font-black hidden sm:inline">
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
                : "bg-leather-light border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300",
            )}
            title={isPublic ? "Tu álbum es público" : "Tu álbum es privado"}
          >
            {isPublic ? <Globe size={16} /> : <Lock size={16} />}
            <span className="text-xs uppercase tracking-wider font-black hidden sm:inline">
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
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
            Anterior
          </span>
        </button>

        <div>
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
                      : "w-1.5 bg-zinc-700 hover:bg-zinc-500 cursor-pointer",
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
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
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
