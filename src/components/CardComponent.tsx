"use client";

import { motion } from "framer-motion";
import { Card, SlotState } from "@/types";
import { twMerge } from "tailwind-merge";
import { Star, Bookmark } from "lucide-react";

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

const rarityGlow: Record<string, string> = {
  SR: "shadow-[0_0_14px_rgba(244,160,24,0.35)] ring-1 ring-gold/30",
  SEC: "shadow-[0_0_18px_rgba(251,146,60,0.4)] ring-1 ring-orange-400/40",
  "SP CARD":
    "shadow-[0_0_14px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/30",
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
          "relative w-42 aspect-63/88 rounded-xl overflow-hidden cursor-pointer bg-leather-light",
          isWishlist && "grayscale opacity-45",
          isOwned && "shadow-md shadow-black/60",
          isRare && isOwned && rarityGlow[card.rarity],
          isEmpty && isAlbumView && "border-2 border-dashed border-white/8",
        )}
        whileHover={
          !isEmpty
            ? {
                scale: 1.05,
                rotateY: 6,
                rotateX: 2,
                transition: { type: "spring", stiffness: 380, damping: 22 },
              }
            : {}
        }
        style={{ transformStyle: "preserve-3d" }}
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

            {/* Rare overlay */}
            {isOwned && isRare && (
              <div className="absolute inset-0 bg-linear-to-tr from-gold/8 via-transparent to-white/5 pointer-events-none mix-blend-overlay" />
            )}

            {/* Wishlist overlay */}
            {isWishlist && (
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/20 pointer-events-none" />
            )}

            {/* Custom badge */}
            {card.isCustom && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-purple-500/80 rounded text-[7px] font-black uppercase text-white backdrop-blur-sm">
                ★
              </div>
            )}

            {/* Hover info (database view) */}
            {!isAlbumView && (
              <div className="absolute inset-x-0 bottom-0 py-3 px-3 bg-linear-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-end justify-between">
                  <div className="min-w-0">
                    <p className="text-[9px] text-zinc-500 font-mono">
                      {card.serial}
                    </p>
                    <h3 className="text-xs font-bold text-white truncate">
                      {card.name}
                    </h3>
                  </div>
                  <span
                    className={twMerge(
                      "text-[9px] font-black italic shrink-0 ml-1",
                      rarityColors[card.rarity] || "text-zinc-400",
                    )}
                  >
                    {card.rarity}
                  </span>
                </div>
              </div>
            )}

            {/* Wishlist bookmark */}
            {isWishlist && (
              <div className="absolute top-1.5 right-1.5 p-0.5 bg-black/50 rounded backdrop-blur-sm">
                <Bookmark size={10} className="text-white/60 fill-white/60" />
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
