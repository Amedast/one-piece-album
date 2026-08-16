"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookPlus, Globe, Lock, Loader2, LayoutGrid } from "lucide-react";
import { useAlbum } from "@/context/AlbumContext";
import { useSession } from "@/lib/auth-client";
import type { AlbumSize } from "@/types";

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAlbumModal({
  isOpen,
  onClose,
}: CreateAlbumModalProps) {
  const { createAlbum } = useAlbum();
  const { data: session } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState<AlbumSize>("4x3");
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Por favor, introduce un nombre para el álbum.");
      return;
    }

    if (!session?.user) {
      window.dispatchEvent(new Event("open-auth-modal"));
      onClose();
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const albumId = await createAlbum(title.trim(), description.trim(), isPublic, size);
      if (albumId) {
        setTitle("");
        setDescription("");
        setSize("4x3");
        setIsPublic(true);
        onClose();
      } else {
        setError("No se pudo guardar el álbum en el servidor.");
      }
    } catch {
      setError("Ocurrió un error al crear el álbum.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-lg bg-leather border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                <BookPlus size={18} />
              </div>
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white leading-tight">
                  Crear Nuevo Álbum
                </h2>
                <p className="text-zinc-400 text-xs font-crimson">
                  Crea una nueva colección para organizar tus cartas temáticas o sets.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer p-2 bg-leather-light rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all shrink-0"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-2">
                Nombre del Álbum <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Colección OP-05, Luffy Master Set..."
                maxLength={50}
                required
                autoFocus
                className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción o temática de este álbum..."
                rows={3}
                maxLength={200}
                className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all resize-none font-medium"
              />
            </div>

            {/* Grid Size selector */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-2">
                Tamaño de Página
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "3x3" as AlbumSize, label: "3x3", count: "9 cartas", subtitle: "3 col × 3 filas" },
                  { id: "4x3" as AlbumSize, label: "4x3", count: "12 cartas", subtitle: "4 col × 3 filas (Estándar)" },
                  { id: "4x4" as AlbumSize, label: "4x4", count: "16 cartas", subtitle: "4 col × 4 filas" },
                ].map((opt) => {
                  const selected = size === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSize(opt.id)}
                      className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all active:scale-[0.98] ${
                        selected
                          ? "bg-gold/10 border-gold/40 text-gold ring-1 ring-gold/20"
                          : "bg-leather-light border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                      }`}
                    >
                      <span className="font-cinzel text-sm font-black text-white">{opt.label}</span>
                      <span className="text-[11px] font-bold mt-0.5 text-zinc-300">{opt.count}</span>
                      <span className="text-[9px] text-zinc-500 font-crimson mt-0.5">{opt.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility toggle */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-2">
                Visibilidad
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`cursor-pointer flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    isPublic
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/20"
                      : "bg-leather-light border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <Globe size={18} className={isPublic ? "text-emerald-400 shrink-0" : "text-zinc-500 shrink-0"} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Público</div>
                    <div className="text-[10px] text-zinc-400 font-crimson line-clamp-1">
                      Visible en tu perfil
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`cursor-pointer flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    !isPublic
                      ? "bg-gold/10 border-gold/40 text-gold ring-1 ring-gold/20"
                      : "bg-leather-light border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <Lock size={18} className={!isPublic ? "text-gold shrink-0" : "text-zinc-500 shrink-0"} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Privado</div>
                    <div className="text-[10px] text-zinc-400 font-crimson line-clamp-1">
                      Solo visible por ti
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="cursor-pointer px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating || !title.trim()}
                className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-gold text-obsidian hover:bg-gold-bright rounded-xl text-xs font-black uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <span>Crear Álbum</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
