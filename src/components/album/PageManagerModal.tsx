"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  Pencil,
  Trash2,
  Check,
  GripVertical,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useAlbum } from "@/context/AlbumContext";
import { AlbumPage } from "@/types";
import { twMerge } from "tailwind-merge";

interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: (index: number) => void;
}

export default function PageManagerModal({
  isOpen,
  onClose,
  onNavigateToPage,
}: PageManagerModalProps) {
  const { album, addPage, deletePage, renamePage, reorderPages } = useAlbum();
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const startEdit = (page: AlbumPage) => {
    setEditingPageId(page.pageId);
    setEditName(page.title);
  };

  const saveEdit = () => {
    if (editingPageId && editName.trim()) {
      renamePage(editingPageId, editName.trim());
    }
    setEditingPageId(null);
    setEditName("");
  };

  const handleDelete = (pageId: string) => {
    if (album.pages.length <= 1) return;
    if (confirmDelete === pageId) {
      deletePage(pageId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(pageId);
    }
  };

  const getPageStats = (page: AlbumPage) => {
    const owned = page.slots.filter((s) => s.state === "OWNED").length;
    const wishlist = page.slots.filter((s) => s.state === "WISHLIST").length;
    const total = page.slots.length;
    return { owned, wishlist, empty: total - owned - wishlist, total };
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (targetIndex: number) => {
    if (dragIndex !== null && dragIndex !== targetIndex) {
      reorderPages(dragIndex, targetIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

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
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg bg-leather border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                  <Settings size={18} className="text-gold" />
                </div>
                <div>
                  <h2 className="font-cinzel text-base font-bold text-white">
                    Gestionar Páginas
                  </h2>
                  <p className="text-zinc-500 text-xs font-crimson">
                    {album.pages.length} páginas en el álbum
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer p-2 bg-leather-light rounded-xl text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Page list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {album.pages.map((page, index) => {
                const stats = getPageStats(page);
                const isEditing = editingPageId === page.pageId;
                const isConfirmDelete = confirmDelete === page.pageId;
                const isDragging = dragIndex === index;
                const isDragTarget =
                  dragOverIndex === index && dragIndex !== index;

                return (
                  <div
                    key={page.pageId}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={twMerge(
                      "flex items-center gap-3 bg-leather-light border rounded-2xl px-4 py-3 transition-all",
                      isDragging && "opacity-40",
                      isDragTarget && "border-gold/40 bg-gold/5",
                      !isDragging &&
                        !isDragTarget &&
                        "border-white/8 hover:border-white/15",
                    )}
                  >
                    {/* Drag handle */}
                    <GripVertical
                      size={16}
                      className="text-zinc-600 cursor-grab shrink-0"
                    />

                    {/* Page info */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") setEditingPageId(null);
                          }}
                          autoFocus
                          className="bg-obsidian border border-gold/40 rounded-lg px-2 py-1 text-sm text-white outline-none w-full font-crimson"
                        />
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-crimson font-bold text-white text-sm cursor-pointer hover:text-gold transition-colors"
                              onClick={() => {
                                onNavigateToPage(index);
                                onClose();
                              }}
                            >
                              {page.title}
                            </span>
                            <span className="text-[9px] text-zinc-600 font-mono">
                              #{index + 1}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            <StatDot
                              color="bg-gold"
                              count={stats.owned}
                              label="owned"
                            />
                            <StatDot
                              color="bg-zinc-500"
                              count={stats.wishlist}
                              label="wishlist"
                            />
                            <StatDot
                              color="bg-zinc-800"
                              count={stats.empty}
                              label="vacíos"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <button
                          onClick={saveEdit}
                          className="cursor-pointer p-1.5 text-gold hover:bg-gold/10 rounded-lg transition-colors"
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEdit(page)}
                          className="cursor-pointer p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                      )}

                      {album.pages.length > 1 && (
                        <button
                          onClick={() => handleDelete(page.pageId)}
                          className={twMerge(
                            "cursor-pointer p-1.5 rounded-lg transition-all",
                            isConfirmDelete
                              ? "bg-crimson/20 text-crimson"
                              : "text-zinc-600 hover:text-crimson hover:bg-crimson/10",
                          )}
                          title={
                            isConfirmDelete
                              ? "Clic para confirmar"
                              : "Eliminar página"
                          }
                        >
                          {isConfirmDelete ? (
                            <AlertTriangle size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add page button */}
            <div className="px-4 pb-4 shrink-0">
              <button
                onClick={() => addPage()}
                className="cursor-pointer w-full py-3 border-2 border-dashed border-white/10 hover:border-gold/40 rounded-2xl text-zinc-500 hover:text-gold text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Añadir página
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StatDot({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[9px] text-zinc-600">
        {count} {label}
      </span>
    </div>
  );
}
