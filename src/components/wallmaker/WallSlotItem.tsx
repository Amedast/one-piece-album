"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Card, WallSlot } from "@/types";
import { getCardImageUrl } from "@/lib/image-utils";
import { Plus, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface WallSlotItemProps {
  slot: WallSlot;
  slotIndex?: number;
  isDragSource: boolean;
  isDragTarget: boolean;
  onOpenSearch: (slotId: string) => void;
  onClearSlot: (slotId: string) => void;
  onOpenCardDetails?: (card: Card) => void;
  onDragStart: (slotId: string) => void;
  onDragOver: (slotId: string) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export default function WallSlotItem({
  slot,
  isDragSource,
  isDragTarget,
  onOpenSearch,
  onClearSlot,
  onOpenCardDetails,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: WallSlotItemProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const card = slot.cardData;
  const isEmpty = !card;
  const imgSrc =
    card?.imageData || (card?.url ? getCardImageUrl(card.url) : "") || "";

  return (
    <div
      className={twMerge(
        "relative group select-none cursor-pointer",
        isDragSource && "opacity-50",
        isDragTarget && !isEmpty && "scale-[1.04] z-10"
      )}
      draggable={!isEmpty}
      onDragStart={(e) => {
        if (isEmpty) return;
        e.dataTransfer.setData("text/plain", slot.slotId);
        onDragStart(slot.slotId);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(slot.slotId);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (isEmpty) onOpenSearch(slot.slotId);
        else if (card) onOpenCardDetails?.(card);
      }}
    >
      {/* Marco de la carta — color #0f0f0f y borde sutilmente más oscuro */}
      <motion.div
        className="relative w-full aspect-63/88 overflow-hidden transition-all duration-300 cursor-pointer"
        style={{
          backgroundColor: "#0f0f0f",
          padding: "6px",
          border: "2px solid #242424",
          borderRadius: "10px",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        {/* Interior de la carta */}
        <div
          className="w-full h-full overflow-hidden relative"
          style={{
            backgroundColor: "#1a1a22",
            borderRadius: "6px",
            border: "2px solid #202020",
          }}
        >
          {/* Slot vacío */}
          {isEmpty && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSearch(slot.slotId);
              }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-gold transition-colors duration-200 group/add cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-dashed border-zinc-700 group-hover/add:border-gold/50 flex items-center justify-center transition-colors">
                <Plus size={16} strokeWidth={2} />
              </div>
            </button>
          )}

          {/* Imagen de la carta */}
          {!isEmpty && imgSrc && (
            <>
              <div
                className={twMerge(
                  "absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}
                style={{ backgroundImage: `url(${imgSrc})` }}
              />

              {!isImageLoaded && (
                <div className="absolute inset-0 skeleton-pulse animate-pulse" />
              )}

              <img
                src={imgSrc}
                alt={card.name || "Card"}
                className="hidden"
                onLoad={() => setIsImageLoaded(true)}
              />

              {/* Hover overlay sutil */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none" />

              {card.isCustom && (
                <div
                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-white backdrop-blur-sm shadow-md"
                  style={{ backgroundColor: "rgba(147,51,234,0.8)" }}
                >
                  ★
                </div>
              )}

              {/* Botón X para eliminar: siempre visible en móviles/tablets y visible en hover en desktop */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSlot(slot.slotId);
                }}
                className="cursor-pointer absolute top-1.5 right-1.5 p-1 bg-crimson hover:bg-crimson-light text-white rounded-full shadow-lg shadow-black/70 transition-all z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-110 active:scale-95 pointer-events-auto"
                title="Quitar carta"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
