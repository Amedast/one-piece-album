"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlbum } from "@/context/AlbumContext";
import AlbumHeader from "@/components/album/AlbumHeader";
import AlbumSlotCard from "@/components/album/AlbumSlotCard";
import AlbumSearchModal from "@/components/AlbumSearchModal";
import WishlistUrlsModal from "@/components/album/WishlistUrlsModal";
import CustomCardModal from "@/components/album/CustomCardModal";
import PageManagerModal from "@/components/album/PageManagerModal";
import CardDetailsModal from "@/components/CardDetailsModal";
import type {
  AlbumPage as AlbumPageData,
  AlbumSlot,
  Card,
  SlotState,
} from "@/types";
import { BookOpen, Plus } from "lucide-react";

type SearchContext = {
  pageId: string;
  slotId: string;
  replaceState?: "OWNED" | "WISHLIST";
};

type WishlistContext = {
  pageId: string;
  slot: AlbumSlot;
};

type DetailContext = {
  card: Card;
  pageId: string;
  slotId: string;
  currentState: "OWNED" | "WISHLIST";
  currentLanguage?: "JP" | "EN";
};

export default function AlbumPage() {
  const { album, addPage, updateSlot, clearSlot, reorderSlots, isLoaded } =
    useAlbum();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isReorganizeMode, setIsReorganizeMode] = useState(false);

  // Drag state
  const [dragSource, setDragSource] = useState<{
    pageId: string;
    slotId: string;
  } | null>(null);
  const [dragTarget, setDragTarget] = useState<{
    pageId: string;
    slotId: string;
  } | null>(null);

  // Modals
  const [searchCtx, setSearchCtx] = useState<SearchContext | null>(null);
  const [wishlistCtx, setWishlistCtx] = useState<WishlistContext | null>(null);
  const [isCustomCardOpen, setIsCustomCardOpen] = useState(false);
  const [isPageManagerOpen, setIsPageManagerOpen] = useState(false);
  const [detailCtx, setDetailCtx] = useState<DetailContext | null>(null);

  /* ---- Pages ---- */
  // currentPageIndex represents the "spread" index (0 = first spread).
  // We offset by 1 so the first spread has an empty left page and page[0] on the right.
  // Spread k: left = pages[k - 1], right = pages[k]
  const leftPage = album.pages[currentPageIndex - 1] ?? null;   // null on first spread
  const rightPage = album.pages[currentPageIndex] ?? null;       // null after last page
  const totalPages = album.pages.length;

  // Total spreads = totalPages + 1  (empty cover on each side)
  const totalSpreads = totalPages + 1;

  const handlePrev = () => setCurrentPageIndex((i) => Math.max(0, i - 2));
  const handleNext = () => {
    // Allow advancing while there are more spreads
    if (currentPageIndex + 2 < totalSpreads) setCurrentPageIndex((i) => i + 2);
  };
  const handleNavigateToPage = (index: number) => {
    // index is the 0-based page index; in spread terms it sits at spread (index + 1)
    const spreadIndex = index + 1;
    setCurrentPageIndex(spreadIndex % 2 === 0 ? spreadIndex : spreadIndex - 1);
  };

  /* ---- Drag ---- */
  const handleDragStart = (pageId: string, slotId: string) => {
    setDragSource({ pageId, slotId });
    setDragTarget(null);
  };
  const handleDragOver = (pageId: string, slotId: string) => {
    if (
      dragSource &&
      !(dragSource.pageId === pageId && dragSource.slotId === slotId)
    ) {
      setDragTarget({ pageId, slotId });
    }
  };
  const handleDrop = () => {
    if (dragSource && dragTarget) {
      reorderSlots(
        dragSource.pageId,
        dragSource.slotId,
        dragTarget.pageId,
        dragTarget.slotId,
      );
    }
    setDragSource(null);
    setDragTarget(null);
  };
  const handleDragEnd = () => {
    setDragSource(null);
    setDragTarget(null);
  };

  /* ---- Search / Select ---- */
  const handleOpenSearch = (
    pageId: string,
    slotId: string,
    replaceState?: "OWNED" | "WISHLIST",
  ) => {
    setSearchCtx({ pageId, slotId, replaceState });
  };
  const handleCardSelect = (card: Card, state: SlotState, language?: "JP" | "EN") => {
    if (searchCtx) {
      updateSlot(searchCtx.pageId, searchCtx.slotId, card, state, language);
      setSearchCtx(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto animate-pulse">
            <BookOpen size={24} className="text-gold" />
          </div>
          <p className="text-zinc-500 text-sm font-crimson">
            Cargando tu álbum...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-20 px-4 md:px-8">
      <div className="max-w-[1500px] mx-auto">
        <AlbumHeader
          currentPageIndex={currentPageIndex}
          totalPages={totalPages}
          totalSpreads={totalSpreads}
          isReorganizeMode={isReorganizeMode}
          onPrev={handlePrev}
          onNext={handleNext}
          onAddPage={() => addPage()}
          onToggleReorganize={() => setIsReorganizeMode((m) => !m)}
          onOpenCustomCard={() => setIsCustomCardOpen(true)}
          onOpenPageManager={() => setIsPageManagerOpen(true)}
        />

        {/* Binder spread */}
        <div className="relative">
          {/* Outer binder frame */}
          <div className="relative bg-[#0D1018] rounded-[2.5rem] border border-white/6 shadow-2xl overflow-hidden">
            {/* The spread pages */}
            <div className="flex flex-col lg:flex-row gap-0">
              {/* Left Page — null on the very first spread (cover) */}
              {leftPage ? (
                <AlbumPagePanel
                  page={leftPage}
                  pageNumber={currentPageIndex}          // real page number = spreadIndex - 1 = currentPageIndex
                  isReorganizeMode={isReorganizeMode}
                  dragSource={dragSource}
                  dragTarget={dragTarget}
                  onOpenSearch={handleOpenSearch}
                  onClearSlot={clearSlot}
                  onOpenWishlistUrls={(pageId, slotId) => {
                    const slot = leftPage?.slots.find((s) => s.slotId === slotId);
                    if (slot) setWishlistCtx({ pageId, slot });
                  }}
                  onOpenCardDetails={(card, pageId, slotId, currentState, currentLanguage) =>
                    setDetailCtx({ card, pageId, slotId, currentState, currentLanguage })
                  }
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  side="left"
                />
              ) : (
                <CoverPlaceholder side="left" />
              )}

              {/* Spine */}
              <div className="hidden lg:flex flex-col items-center justify-between py-16 px-3 bg-spine gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="ring-hole" />
                ))}
              </div>

              {/* Right Page — null after the last real page (back cover) */}
              {rightPage ? (
                <AlbumPagePanel
                  page={rightPage}
                  pageNumber={currentPageIndex + 1}      // real page number = spreadIndex
                  isReorganizeMode={isReorganizeMode}
                  dragSource={dragSource}
                  dragTarget={dragTarget}
                  onOpenSearch={handleOpenSearch}
                  onClearSlot={clearSlot}
                  onOpenWishlistUrls={(pageId, slotId) => {
                    const slot = rightPage?.slots.find(
                      (s) => s.slotId === slotId,
                    );
                    if (slot) setWishlistCtx({ pageId, slot });
                  }}
                  onOpenCardDetails={(card, pageId, slotId, currentState, currentLanguage) =>
                    setDetailCtx({ card, pageId, slotId, currentState, currentLanguage })
                  }
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  side="right"
                />
              ) : (
                <EmptyPagePlaceholder onAddPage={() => addPage()} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AlbumSearchModal
        isOpen={!!searchCtx}
        onClose={() => setSearchCtx(null)}
        onSelect={handleCardSelect}
        defaultState={searchCtx?.replaceState || "OWNED"}
      />

      {wishlistCtx && (
        <WishlistUrlsModal
          isOpen={!!wishlistCtx}
          onClose={() => setWishlistCtx(null)}
          pageId={wishlistCtx.pageId}
          slot={wishlistCtx.slot}
        />
      )}

      <CustomCardModal
        isOpen={isCustomCardOpen}
        onClose={() => setIsCustomCardOpen(false)}
      />

      <PageManagerModal
        isOpen={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        onNavigateToPage={handleNavigateToPage}
      />

      {detailCtx && (
        <CardDetailsModal
          card={detailCtx.card}
          pageId={detailCtx.pageId}
          slotId={detailCtx.slotId}
          currentSlotState={detailCtx.currentState}
          currentLanguage={detailCtx.currentLanguage}
          isOpen={!!detailCtx}
          onClose={() => setDetailCtx(null)}
        />
      )}
    </main>
  );
}

/* ---- Sub-components ---- */

function AlbumPagePanel({
  page,
  pageNumber,
  isReorganizeMode,
  dragSource,
  dragTarget,
  onOpenSearch,
  onClearSlot,
  onOpenWishlistUrls,
  onOpenCardDetails,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  side,
}: {
  page: AlbumPageData;
  pageNumber: number;
  isReorganizeMode: boolean;
  dragSource: { pageId: string; slotId: string } | null;
  dragTarget: { pageId: string; slotId: string } | null;
  onOpenSearch: (
    pageId: string,
    slotId: string,
    state?: "OWNED" | "WISHLIST",
  ) => void;
  onClearSlot: (pageId: string, slotId: string) => void;
  onOpenWishlistUrls: (pageId: string, slotId: string) => void;
  onOpenCardDetails: (
    card: Card,
    pageId: string,
    slotId: string,
    currentState: "OWNED" | "WISHLIST",
    currentLanguage?: "JP" | "EN",
  ) => void;
  onDragStart: (pageId: string, slotId: string) => void;
  onDragOver: (pageId: string, slotId: string) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  side: "left" | "right";
}) {
  return (
    <div className="flex-1 bg-leather min-h-[640px] lg:min-h-[700px]">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
          <span className="font-cinzel text-[11px] text-zinc-500 tracking-widest uppercase">
            {page.title}
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-700">
          {pageNumber}
        </span>
      </div>

      {/* Card grid: 4 cols × 3 rows */}
      <div className="grid grid-cols-4 gap-4 p-8">
        {page.slots.map((slot, index) => (
          <AlbumSlotCard
            key={slot.slotId}
            slot={slot}
            slotIndex={index}
            pageId={page.pageId}
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
            onOpenSearch={onOpenSearch}
            onClearSlot={onClearSlot}
            onOpenWishlistUrls={onOpenWishlistUrls}
            onOpenCardDetails={(card) =>
              onOpenCardDetails(
                card,
                page.pageId,
                slot.slotId,
                slot.state as "OWNED" | "WISHLIST",
                slot.language,
              )
            }
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

/** Shown as the left page of the very first spread (blank inside-cover). */
function CoverPlaceholder({ side }: { side: "left" | "right" }) {
  return (
    <div className="flex-1 bg-leather min-h-[640px] lg:min-h-[700px] flex items-center justify-center">
      <p className="font-cinzel text-[11px] text-zinc-700 tracking-widest uppercase select-none">
        {side === "left" ? "Portada" : "Contraportada"}
      </p>
    </div>
  );
}

function EmptyPagePlaceholder({ onAddPage }: { onAddPage: () => void }) {
  return (
    <div className="flex-1 bg-leather-light min-h-160 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center">
        <Plus size={28} className="text-zinc-700" />
      </div>
      <div className="text-center">
        <p className="text-zinc-600 font-black uppercase tracking-widest text-xs mb-1">
          Fin del Álbum
        </p>
        <p className="text-zinc-700 text-xs font-crimson">
          ¿Necesitas más espacio?
        </p>
      </div>
      <button
        onClick={onAddPage}
        className="cursor-pointer px-5 py-2.5 bg-gold/10 border border-gold/30 text-gold rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gold/20 transition-all"
      >
        Añadir Página
      </button>
    </div>
  );
}
