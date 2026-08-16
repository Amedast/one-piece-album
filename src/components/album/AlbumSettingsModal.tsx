"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  Globe,
  Lock,
  Star,
  Trash2,
  AlertTriangle,
  Loader2,
  Check,
} from "lucide-react";
import { useAlbum } from "@/context/AlbumContext";

interface AlbumSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlbumSettingsModal({
  isOpen,
  onClose,
}: AlbumSettingsModalProps) {
  const { album, albums, updateAlbumDetails, deleteAlbum } = useAlbum();

  const [title, setTitle] = useState(album.title || "Mi Álbum");
  const [description, setDescription] = useState(album.description || "");
  const [isPublic, setIsPublic] = useState(album.isPublic ?? true);
  const [isDefault, setIsDefault] = useState(album.isDefault ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(album.title || "Mi Álbum");
      setDescription(album.description || "");
      setIsPublic(album.isPublic ?? true);
      setIsDefault(album.isDefault ?? false);
      setConfirmDelete(false);
      setSaveSuccess(false);
    }
  }, [isOpen, album]);

  const canDelete = albums.length > 1;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await updateAlbumDetails(album.id, {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        isDefault,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      const ok = await deleteAlbum(album.id);
      if (ok) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
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

        {/* Modal content matching PageManagerModal */}
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
                <Settings size={18} />
              </div>
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white leading-tight">
                  Ajustes del Álbum
                </h2>
                <p className="text-zinc-400 text-xs font-crimson">
                  Configura el nombre, visibilidad y preferencias de este álbum.
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

          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-2">
                Nombre del Álbum <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nombre del álbum..."
                maxLength={50}
                required
                className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional..."
                rows={3}
                maxLength={200}
                className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all resize-none font-medium"
              />
            </div>

            {/* Visibility cards */}
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
                      Visible en la comunidad
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
                      Solo visible para ti
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Default album toggle card */}
            <div>
              <button
                type="button"
                onClick={() => setIsDefault(!isDefault)}
                className={`cursor-pointer w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border text-left transition-all active:scale-[0.99] ${
                  isDefault
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "bg-leather-light border-white/10 text-zinc-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Star size={17} className={isDefault ? "text-gold fill-gold shrink-0" : "text-zinc-500 shrink-0"} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Álbum Principal por Defecto</div>
                    <div className="text-[10px] text-zinc-400 font-crimson">
                      Se carga automáticamente al entrar en tu colección
                    </div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ml-3 ${
                    isDefault ? "bg-gold border-gold text-obsidian" : "border-white/20 bg-obsidian"
                  }`}
                >
                  {isDefault && <Check size={13} strokeWidth={3} />}
                </div>
              </button>
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-white/8 flex items-center justify-between">
              {/* Left: Delete option only if allowed */}
              <div>
                {canDelete ? (
                  confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold hover:bg-red-500/30 active:scale-95 transition-all"
                      >
                        {isDeleting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <AlertTriangle size={13} />
                        )}
                        <span>¿Confirmar?</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="cursor-pointer px-2.5 py-2 text-zinc-400 hover:text-white text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="cursor-pointer flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-medium transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                      <span>Eliminar Álbum</span>
                    </button>
                  )
                ) : <div />}
              </div>

              {/* Right: Save button without glow or Close button */}
              <div className="flex items-center">
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-gold text-obsidian hover:bg-gold-bright rounded-xl text-xs font-black uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check size={15} />
                      <span>¡Guardado!</span>
                    </>
                  ) : (
                    <span>Guardar Ajustes</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
