"use client";

import AlbumSlotCard from "@/components/album/AlbumSlotCard";
import type { AlbumPage, AlbumSlot, Card, WishlistUrl } from "@/types";

interface AlbumPagePanelProps {
  page: AlbumPage;
  pageNumber: number;
  readOnly?: boolean;
  isReorganizeMode?: boolean;
  dragSource?: { pageId: string; slotId: string } | null;
  dragTarget?: { pageId: string; slotId: string } | null;
  onOpenCardDetails?: (
    card: Card,
    pageId: string,
    slotId: string,
    currentState: "OWNED" | "WISHLIST",
    currentLanguage?: "JP" | "EN",
    wishlistUrls?: WishlistUrl[],
  ) => void;
  onOpenWishlistUrls?: (pageId: string, slot: AlbumSlot) => void;
  onOpenSearch?: (pageId: string, slotId: string, state?: "OWNED" | "WISHLIST") => void;
  onClearSlot?: (pageId: string, slotId: string) => void;
  onDragStart?: (pageId: string, slotId: string) => void;
  onDragOver?: (pageId: string, slotId: string) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  variant?: "compact" | "tall";
}

export default function AlbumPagePanel({
  page,
  pageNumber,
  readOnly = false,
  isReorganizeMode = false,
  dragSource = null,
  dragTarget = null,
  onOpenCardDetails,
  onOpenWishlistUrls,
  onOpenSearch,
  onClearSlot,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  variant = "compact",
}: AlbumPagePanelProps) {
  const minH =
    variant === "tall" ? "min-h-160 lg:min-h-175" : "min-h-[480px] lg:min-h-[700px]";
  const gridGap =
    variant === "tall" ? "gap-4 p-8" : "gap-1.5 sm:gap-4 p-3 sm:p-8";

  return (
    <div className={`flex-1 bg-leather ${minH}`}>
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
          <span className="font-cinzel text-[11px] text-zinc-500 tracking-widest uppercase">
            {page.title}
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-700">{pageNumber}</span>
      </div>

      <div className={`grid grid-cols-4 ${gridGap}`}>
        {page.slots.map((slot, index) => (
          <AlbumSlotCard
            key={slot.slotId}
            slot={slot}
            slotIndex={index}
            pageId={page.pageId}
            readOnly={readOnly}
            isReorganizeMode={isReorganizeMode}
            isDragSource={
              !!dragSource &&
              dragSource.pageId === page.pageId &&
              dragSource.slotId === slot.slotId
            }
            isDragTarget={
              !!dragTarget &&
              dragTarget.pageId === page.pageId &&
              dragTarget.slotId === slot.slotId
            }
            onOpenSearch={onOpenSearch ?? (() => {})}
            onClearSlot={onClearSlot ?? (() => {})}
            onOpenWishlistUrls={(pageId, slotId) => {
              const foundSlot = page.slots.find((s) => s.slotId === slotId);
              if (foundSlot) onOpenWishlistUrls?.(pageId, foundSlot);
            }}
            onOpenCardDetails={(card) =>
              onOpenCardDetails?.(
                card,
                page.pageId,
                slot.slotId,
                slot.state as "OWNED" | "WISHLIST",
                slot.language,
                slot.wishlistUrls,
              )
            }
            onDragStart={onDragStart ?? (() => {})}
            onDragOver={onDragOver ?? (() => {})}
            onDrop={onDrop ?? (() => {})}
            onDragEnd={onDragEnd ?? (() => {})}
          />
        ))}
      </div>
    </div>
  );
}