"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlbumSlot, Card } from "@/types";
import {
  X,
  GripVertical,
  Bookmark,
  Link as LinkIcon,
  Plus,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

interface AlbumSlotCardProps {
  slot: AlbumSlot;
  slotIndex: number;
  pageId: string;
  isReorganizeMode: boolean;
  isDragSource: boolean;
  isDragTarget: boolean;
  onOpenSearch: (
    pageId: string,
    slotId: string,
    replaceState?: "OWNED" | "WISHLIST",
  ) => void;
  onClearSlot: (pageId: string, slotId: string) => void;
  onOpenWishlistUrls: (pageId: string, slotId: string) => void;
  onOpenCardDetails: (card: Card) => void;
  onDragStart: (pageId: string, slotId: string) => void;
  onDragOver: (pageId: string, slotId: string) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

const rarityGlow: Record<string, string> = {
  SR: "shadow-[0_0_16px_rgba(244,160,24,0.4)] ring-1 ring-gold/40",
  SEC: "shadow-[0_0_20px_rgba(255,100,50,0.5)] ring-1 ring-orange-400/50",
  "SP CARD": "shadow-[0_0_16px_rgba(192,57,180,0.4)] ring-1 ring-purple-400/40",
  L: "shadow-[0_0_12px_rgba(220,50,50,0.3)] ring-1 ring-red-400/30",
};

export default function AlbumSlotCard({
  slot,
  slotIndex,
  pageId,
  isReorganizeMode,
  isDragSource,
  isDragTarget,
  onOpenSearch,
  onClearSlot,
  onOpenWishlistUrls,
  onOpenCardDetails,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: AlbumSlotCardProps) {
  const [hovered, setHovered] = useState(false);
  const isEmpty = slot.state === "EMPTY";
  const isOwned = slot.state === "OWNED";
  const isWishlist = slot.state === "WISHLIST";
  const card = slot.cardData;
  const isRare =
    card &&
    (card.rarity === "SR" ||
      card.rarity === "SEC" ||
      card.rarity === "SP CARD");
  const cardGlow = card ? rarityGlow[card.rarity] || "" : "";
  const hasWishlistUrls = slot.wishlistUrls && slot.wishlistUrls.length > 0;

  const imgSrc = card?.imageData || card?.url || "";

  const handleCardClick = () => {
    if (!isReorganizeMode && card && !isEmpty) {
      onOpenCardDetails(card);
    }
  };

  return (
    <div
      className={twMerge(
        "relative group select-none",
        isReorganizeMode && !isEmpty && "cursor-grab active:cursor-grabbing",
        isDragTarget && !isEmpty && "scale-[1.04] z-10",
        isDragSource && "opacity-50",
      )}
      draggable={isReorganizeMode && !isEmpty}
      onDragStart={() => {
        if (!isEmpty) onDragStart(pageId, slot.slotId);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(pageId, slot.slotId);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Slot number label */}
      <div className="absolute -top-2 -left-2 z-20 w-5 h-5 bg-leather-light border border-white/10 rounded-full flex items-center justify-center">
        <span className="text-[8px] font-bold text-zinc-500">
          {slotIndex + 1}
        </span>
      </div>

      <motion.div
        className={twMerge(
          "relative w-full aspect-[63/88] rounded-xl overflow-hidden transition-all duration-300 bg-leather-light",
          // Empty slot
          isEmpty &&
            "border-2 border-dashed border-white/8 hover:border-gold/30",
          // Owned
          isOwned && "shadow-lg shadow-black/60",
          isOwned && isRare && cardGlow,
          // Wishlist
          isWishlist && "opacity-40 grayscale",
          // Drag target highlight
          isDragTarget && "ring-2 ring-gold border border-gold/50",
          // Reorganize mode visual
          isReorganizeMode && !isEmpty && "ring-1 ring-gold/30",
          // Clickable card cursor
          !isEmpty && !isReorganizeMode && "cursor-pointer",
        )}
        onClick={handleCardClick}
        whileHover={
          !isReorganizeMode && !isEmpty
            ? { scale: 1.04, rotateY: 6, rotateX: 2 }
            : {}
        }
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Empty State */}
        {isEmpty ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSearch(pageId, slot.slotId, "OWNED");
            }}
            className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-gold transition-colors duration-200 group/add cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full border border-dashed border-zinc-700 group-hover/add:border-gold/50 flex items-center justify-center transition-colors">
              <Plus size={16} strokeWidth={2} />
            </div>
          </button>
        ) : (
          <>
            {/* Card image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${imgSrc})` }}
            />

            {/* Rare shimmer overlay */}
            {isOwned && isRare && (
              <div className="absolute inset-0 bg-linear-to-tr from-gold/10 via-transparent to-white/5 pointer-events-none mix-blend-overlay" />
            )}

            {/* Hover overlay for card details hint */}
            {!isReorganizeMode && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none rounded-xl" />
            )}

            {/* Wishlist bookmark indicator */}
            {isWishlist && (
              <div className="absolute top-2 right-2 p-1 bg-black/60 rounded-md backdrop-blur-sm">
                <Bookmark size={12} className="text-white/70 fill-white/70" />
              </div>
            )}

            {/* Language badge */}
            {slot.language && (
              <div
                className={twMerge(
                  "absolute right-2 px-1.5 py-0.5 rounded text-[12px] font-black uppercase tracking-wider text-white backdrop-blur-sm shadow-md border border-white/30",
                  card?.isCustom ? "bottom-2" : "bottom-2",
                  slot.language === "JP"
                    ? "bg-purple-500/80"
                    : "bg-blue-500/80",
                )}
              >
                {slot.language}
              </div>
            )}

            {/* Wishlist URL indicator */}
            {isWishlist && hasWishlistUrls && (
              <div className="absolute bottom-2 right-2 p-1 bg-black/60 rounded-md backdrop-blur-sm">
                <LinkIcon size={10} className="text-blue-400" />
              </div>
            )}
          </>
        )}

        {/* Reorganize drag handle */}
        {isReorganizeMode && !isEmpty && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-2 bg-black/50 rounded-lg backdrop-blur-sm">
              <GripVertical size={20} className="text-gold" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Action buttons — only in non-reorganize mode, only when card exists */}
      <AnimatePresence>
        {hovered && !isReorganizeMode && !isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-2 -right-2 flex flex-col gap-1 z-30"
          >
            {/* Clear */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearSlot(pageId, slot.slotId);
              }}
              className="cursor-pointer p-1 bg-crimson hover:bg-crimson-light text-white rounded-full shadow-lg shadow-black/50 transition-colors"
              title="Quitar carta"
            >
              <X size={10} strokeWidth={3} />
            </button>

            {/* Wishlist URLs (only for wishlist cards) */}
            {isWishlist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenWishlistUrls(pageId, slot.slotId);
                }}
                className={twMerge(
                  "cursor-pointer p-1 rounded-full shadow-lg shadow-black/50 transition-colors",
                  hasWishlistUrls
                    ? "bg-blue-500 hover:bg-blue-400 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400",
                )}
                title="URLs de compra"
              >
                <LinkIcon size={10} strokeWidth={2.5} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
