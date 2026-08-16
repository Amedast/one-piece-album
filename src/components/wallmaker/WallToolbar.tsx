"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallmaker } from "@/context/WallmakerContext";
import DeleteWallModal from "@/components/wallmaker/DeleteWallModal";
import {
  Frame,
  ChevronDown,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Check,
  Loader2,
  FolderPlus,
} from "lucide-react";

interface WallToolbarProps {
  onOpenCreate: () => void;
}

export default function WallToolbar({ onOpenCreate }: WallToolbarProps) {
  const {
    wall,
    walls,
    switchWall,
    deleteWall,
    clearAllSlots,
    isSaving,
    hasUnsavedChanges,
    saveWallToServer,
  } = useWallmaker();

  const [showWallDropdown, setShowWallDropdown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [wallToDelete, setWallToDelete] = useState<{ id: string; title: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWallDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

      {/* Left: Wall Selector (igual que AlbumHeader) */}
      <div className="relative z-30" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowWallDropdown(!showWallDropdown)}
          className="cursor-pointer flex items-center gap-3 px-1.5 py-1.5 rounded-xl bg-leather-light border border-white/10 hover:border-gold/30 hover:bg-leather-light/80 transition-all text-left group active:scale-[0.98]"
          title="Cambiar de cuadro"
        >
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Frame size={16} className="text-gold" />
          </div>
          <div className="flex items-center gap-2 min-w-0 pr-1">
            <h1 className="font-cinzel text-base sm:text-lg font-bold text-white leading-tight truncate max-w-[200px] sm:max-w-[280px]">
              {wall.title || "Mi Cuadro"}
            </h1>
            <ChevronDown
              size={16}
              className={`text-zinc-400 group-hover:text-gold transition-transform duration-200 shrink-0 ${
                showWallDropdown ? "rotate-180 text-gold" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {showWallDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              style={{ width: "380px", maxWidth: "calc(100vw - 2rem)" }}
              className="absolute left-0 top-full mt-2 bg-leather border border-white/10 rounded-2xl shadow-2xl shadow-black z-50 p-3 space-y-2"
            >
              <div className="px-2 py-1 text-[11px] font-black uppercase text-zinc-500 tracking-wider flex items-center justify-between">
                <span>Tus Cuadros ({walls.length})</span>
              </div>

              <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                {walls.map((w) => {
                  const isActive = w.id === wall.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        switchWall(w.id);
                        setShowWallDropdown(false);
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
                            {w.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-crimson">
                          <span>{w.columns}×{w.rows}</span>
                          <span>·</span>
                          <span>{w.filledCount}/{w.totalSlots} cartas</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isActive && <Check size={16} className="text-gold" />}
                        {walls.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWallToDelete({ id: w.id, title: w.title });
                            }}
                            className="cursor-pointer p-1 text-zinc-600 hover:text-red-400 transition-colors"
                            title="Eliminar cuadro"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/8 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowWallDropdown(false);
                    onOpenCreate();
                  }}
                  className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-bold text-gold hover:bg-gold/10 transition-colors w-full active:scale-[0.98] whitespace-nowrap"
                >
                  <Plus size={16} className="shrink-0" />
                  <span>Crear Nuevo Cuadro</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Nuevo cuadro */}
        <motion.button
          type="button"
          onClick={onOpenCreate}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer p-2.5 bg-leather-light border border-white/10 hover:border-gold/30 rounded-xl text-zinc-400 hover:text-gold transition-all"
          title="Crear nuevo cuadro"
        >
          <FolderPlus size={16} />
        </motion.button>

        {/* Clear all */}
        <div className="relative">
          <motion.button
            type="button"
            onClick={() => setShowClearConfirm(!showClearConfirm)}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer p-2.5 bg-leather-light border border-white/10 hover:border-red-500/30 rounded-xl text-zinc-400 hover:text-red-400 transition-all"
            title="Vaciar todas las cartas"
          >
            <RotateCcw size={16} />
          </motion.button>

          <AnimatePresence>
            {showClearConfirm && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-full mt-2 w-52 bg-leather border border-red-500/30 rounded-2xl p-3 shadow-2xl z-50 text-center space-y-2"
              >
                <p className="text-xs font-bold text-white leading-tight">
                  ¿Vaciar todas las cartas del cuadro?
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="cursor-pointer px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold text-zinc-400"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllSlots();
                      setShowClearConfirm(false);
                    }}
                    className="cursor-pointer px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-[11px] font-black text-white"
                  >
                    Sí, vaciar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save */}
        <motion.button
          type="button"
          onClick={() => saveWallToServer()}
          disabled={isSaving}
          whileTap={{ scale: 0.95 }}
          className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
            hasUnsavedChanges
              ? "bg-gold text-obsidian hover:bg-gold-bright border border-gold/50"
              : "bg-leather-light border border-white/10 text-zinc-400 hover:text-white"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span className="hidden sm:inline">Guardando</span>
            </>
          ) : hasUnsavedChanges ? (
            <>
              <Save size={15} />
              <span className="hidden sm:inline">Guardar</span>
            </>
          ) : (
            <>
              <Check size={15} className="text-emerald-400" />
              <span className="hidden sm:inline">Guardado</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Modal de confirmación de eliminación */}
      <DeleteWallModal
        isOpen={!!wallToDelete}
        wallTitle={wallToDelete?.title ?? ""}
        onConfirm={() => {
          if (wallToDelete) deleteWall(wallToDelete.id);
          setWallToDelete(null);
        }}
        onClose={() => setWallToDelete(null)}
      />
    </div>
  );
}
