"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
  Euro,
  MessageSquare,
} from "lucide-react";
import { useAlbum } from "@/context/AlbumContext";
import { AlbumSlot, WishlistUrl } from "@/types";
import { twMerge } from "tailwind-merge";

interface WishlistUrlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  slot: AlbumSlot;
  readOnly?: boolean;
}

const EMPTY_ENTRY: Omit<WishlistUrl, "url"> & { url: string } = {
  url: "",
  price: "",
  notes: "",
};

export default function WishlistUrlsModal({
  isOpen,
  onClose,
  pageId,
  slot,
  readOnly = false,
}: WishlistUrlsModalProps) {
  const { updateSlotWishlistUrls } = useAlbum();

  const [entries, setEntries] = useState<WishlistUrl[]>(
    slot.wishlistUrls || [],
  );
  const [newEntry, setNewEntry] = useState({ url: "", price: "", notes: "" });
  const [error, setError] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAdd = () => {
    const trimmedUrl = newEntry.url.trim();
    if (!trimmedUrl) return;
    if (!isValidUrl(trimmedUrl)) {
      setError("URL inválida. Asegúrate de incluir https://");
      return;
    }
    if (entries.some((e) => e.url === trimmedUrl)) {
      setError("Esta URL ya está añadida");
      return;
    }
    setEntries((prev) => [
      ...prev,
      {
        url: trimmedUrl,
        price: newEntry.price.trim() || undefined,
        notes: newEntry.notes.trim() || undefined,
      },
    ]);
    setNewEntry({ url: "", price: "", notes: "" });
    setError("");
  };

  const handleRemove = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setExpandedIndex(null);
  };

  const handleSave = () => {
    updateSlotWishlistUrls(pageId, slot.slotId, entries);
    onClose();
  };

  const cardName = slot.cardData?.name || "Carta sin nombre";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-lg bg-leather border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/8">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
                    <LinkIcon size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-cinzel text-lg font-bold text-white leading-tight">
                      Dónde Obtenerla
                    </h2>
                    <p className="text-zinc-500 text-xs mt-0.5 font-crimson">
                      {cardName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="cursor-pointer p-2 bg-leather-light rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Entries list */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {entries.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-sm font-crimson italic">
                    Sin fuentes de compra añadidas
                  </div>
                ) : (
                  entries.map((entry, i) => (
                    <div
                      key={i}
                      className="bg-leather-light border border-white/8 rounded-xl overflow-hidden"
                    >
                      {/* Main row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <LinkIcon
                          size={13}
                          className="text-blue-400 shrink-0"
                        />
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-xs text-zinc-300 hover:text-blue-400 transition-colors truncate font-crimson min-w-0"
                          title={entry.url}
                        >
                          {entry.url}
                        </a>
                        {/* Price badge */}
                        {entry.price && (
                          <span className="shrink-0 text-[10px] font-black text-gold bg-gold/10 border border-gold/20 rounded-lg px-2 py-0.5">
                            {entry.price}
                          </span>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"
                          >
                            <ExternalLink size={11} />
                          </a>
                          {!readOnly && (
                            <button
                              onClick={() => handleRemove(i)}
                              className="cursor-pointer p-1 text-zinc-600 hover:text-crimson transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Notes row */}
                      {entry.notes && (
                        <div className="px-4 pb-3 flex items-start gap-2">
                          <MessageSquare
                            size={11}
                            className="text-zinc-600 shrink-0 mt-0.5"
                          />
                          <p className="text-[10px] text-zinc-500 font-crimson italic leading-relaxed">
                            {entry.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add entry form */}
              {!readOnly && (
                <div className="bg-obsidian/60 border border-white/6 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                    Nueva fuente
                  </p>

                  {/* URL */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <LinkIcon
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                      />
                      <input
                        type="url"
                        value={newEntry.url}
                        onChange={(e) => {
                          setNewEntry((p) => ({ ...p, url: e.target.value }));
                          setError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder="https://cardmarket.com/..."
                        className="w-full bg-leather border border-white/8 focus:border-gold/40 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-600 outline-none transition-colors font-crimson"
                      />
                    </div>
                  </div>

                  {/* Price + Notes row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Euro
                        size={12}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                      />
                      <input
                        type="text"
                        value={newEntry.price}
                        onChange={(e) =>
                          setNewEntry((p) => ({ ...p, price: e.target.value }))
                        }
                        placeholder="Precio (ej. 2.50€)"
                        className="w-full bg-leather border border-white/8 focus:border-gold/40 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white placeholder-zinc-600 outline-none transition-colors font-crimson"
                      />
                    </div>
                    <div className="relative">
                      <MessageSquare
                        size={12}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                      />
                      <input
                        type="text"
                        value={newEntry.notes}
                        onChange={(e) =>
                          setNewEntry((p) => ({ ...p, notes: e.target.value }))
                        }
                        placeholder="Comentario..."
                        className="w-full bg-leather border border-white/8 focus:border-gold/40 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white placeholder-zinc-600 outline-none transition-colors font-crimson"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-crimson text-xs font-crimson">{error}</p>
                  )}

                  <button
                    onClick={handleAdd}
                    disabled={!newEntry.url.trim()}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus size={14} /> Añadir Fuente
                  </button>
                </div>
              )}

              {/* Save / Close */}
              {readOnly ? (
                <button
                  onClick={onClose}
                  className="cursor-pointer w-full py-3 bg-leather-light border border-white/10 text-white font-black uppercase text-sm tracking-widest rounded-xl hover:bg-zinc-800 transition-colors font-cinzel"
                >
                  Cerrar
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="cursor-pointer w-full py-3 bg-gold text-obsidian font-black uppercase text-sm tracking-widest rounded-xl hover:bg-gold-bright transition-colors font-cinzel"
                >
                  Guardar
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
