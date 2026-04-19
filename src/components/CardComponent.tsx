"use client";

import { motion } from "framer-motion";
import { Card, SlotState } from "@/types";
import { twMerge } from "tailwind-merge";
import { Star, Bookmark, Check } from "lucide-react";

interface CardComponentProps {
  card: Card;
  slotState?: SlotState;
  isAlbumView?: boolean;
  onClick?: () => void;
}

const rarityColors: Record<string, string> = {
  L: "text-red-400",
  C: "text-zinc-500",
  UC: "text-zinc-400",
  R: "text-blue-400",
  SR: "text-gold",
  SEC: "text-orange-400",
  "SP CARD": "text-purple-400",
  P: "text-emerald-400",
};

const rarityColorsBG: Record<string, string> = {
  L: "bg-red-400/20",
  C: "bg-zinc-500/20",
  UC: "bg-zinc-400/20",
  R: "bg-blue-400/20",
  SR: "bg-gold/20",
  SEC: "bg-orange-400/20",
  "SP CARD": "bg-purple-400/20",
  P: "bg-emerald-400/20",
};

const rarityColorsBorder: Record<string, string> = {
  L: "border-red-400",
  C: "border-zinc-500",
  UC: "border-zinc-400",
  R: "border-blue-400",
  SR: "border-gold",
  SEC: "border-orange-400",
  "SP CARD": "border-purple-400",
  P: "border-emerald-400",
};

export default function CardComponent({
  card,
  slotState = "EMPTY",
  isAlbumView = false,
  onClick,
}: CardComponentProps) {
  const isOwned = slotState === "OWNED";
  const isWishlist = slotState === "WISHLIST";
  const isEmpty = slotState === "EMPTY";
  const isRare =
    card.rarity === "SR" || card.rarity === "SEC" || card.rarity === "SP CARD";
  const imgSrc = card.imageData || card.url;

  return (
    <div className="relative group perspective-1000" onClick={onClick}>
      <motion.div
        className={twMerge(
          "relative w-full aspect-63/88 rounded-md overflow-hidden cursor-pointer bg-leather-light",
          isEmpty && isAlbumView && "border-2 border-dashed border-white/8",
        )}
      >
        {isEmpty && isAlbumView ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-800 text-[8px] font-black uppercase tracking-widest">
              Vacío
            </span>
          </div>
        ) : (
          <>
            {/* Card image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${imgSrc})` }}
            />

            {/* Custom badge */}
            {card.isCustom && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-purple-500/80 rounded text-[7px] font-black uppercase text-white backdrop-blur-sm">
                ★
              </div>
            )}

            {/* Hover info (database view) */}
            {!isAlbumView && (
              <div className="absolute inset-x-0 bottom-0 py-3 px-3 bg-linear-to-t h-20 from-black flex flex-col justify-end to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">
                    {card.name}
                  </h3>
                </div>
                <div className="flex items-end justify-between">
                  <h3 className="text-xs font-bold text-white truncate">
                    {card.serial}
                  </h3>
                  <div
                    className={twMerge(
                      "text-[12px] shrink-0 px-1.5 rounded-md border",
                      rarityColors[card.rarity] || "text-zinc-400",
                      rarityColorsBG[card.rarity] || "bg-zinc-400/50",
                      rarityColorsBorder[card.rarity] || "border-zinc-400",
                    )}
                  >
                    {card.rarity}
                  </div>
                </div>
              </div>
            )}

            {/* Wishlist bookmark */}
            {isWishlist && !isAlbumView && (
              <div className="absolute top-1.5 right-1.5 p-0.5 bg-blue-500/70 rounded backdrop-blur-sm w-6 h-6 flex items-center justify-center">
                <Bookmark
                  size={16}
                  className="text-blue-950 fill-blue-950"
                  strokeWidth={2}
                />
              </div>
            )}

            {/* Owned checkmark for database view */}
            {isOwned && !isAlbumView && (
              <div className="absolute top-1.5 right-1.5 p-0.5 bg-gold/90 rounded backdrop-blur-sm border-2 border-gold">
                <Check size={16} className="text-obsidian" strokeWidth={4} />
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Rare star */}
      {isOwned && isRare && !isAlbumView && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <Star size={8} className="text-gold fill-gold" />
        </div>
      )}
    </div>
  );
}
