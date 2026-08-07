"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlbum } from "@/context/AlbumContext";
import AlbumHeader from "@/components/album/AlbumHeader";
import AlbumPagePanel from "@/components/album/AlbumPagePanel";
import AlbumSearchModal from "@/components/AlbumSearchModal";
import WishlistUrlsModal from "@/components/album/WishlistUrlsModal";
import CustomCardModal from "@/components/album/CustomCardModal";
import PageManagerModal from "@/components/album/PageManagerModal";
import CardDetailsModal from "@/components/CardDetailsModal";
import type {
  AlbumSlot,
  Card,
  SlotState,
  WishlistUrl,
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
  wishlistUrls?: WishlistUrl[];
};

export default function AlbumPage() {
  const { album, addPage, updateSlot, clearSlot, reorderSlots, isLoaded } =
    useAlbum();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isReorganizeMode, setIsReorganizeMode] = useState(false);
  const [isSinglePageView, setIsSinglePageView] = useState(false);

  // Auto-detect mobile to set single page view by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSinglePageView(true);
      } else {
        setIsSinglePageView(false);
      }
    };
    // init
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);
  const [detailCtx, setDetailCtx] = useState<DetailContext | null>(null);

  /* ---- Pages ---- */
  // In Double Page View: currentPageIndex is the even index (0,2,4) representing the left page
  // Spread k: left = pages[currentPageIndex - 1], right = pages[currentPageIndex]
  // In Single Page View: currentPageIndex is the exact page shown
  const leftPage = isSinglePageView
    ? null
    : (album.pages[currentPageIndex - 1] ?? null);
  const rightPage = isSinglePageView
    ? (album.pages[currentPageIndex - 1] ?? null) // if single, current page is pages[currentPageIndex - 1] (0 is cover)
    : (album.pages[currentPageIndex] ?? null);
  const totalPages = album.pages.length;

  // Double View: totalPages + 1  (empty cover on each side).
  // Single View: totalPages + 2 (empty cover on both sides - cover is 0, back is totalPages+1)
  const totalSpreads = isSinglePageView ? totalPages + 2 : totalPages + 1;

  const handlePrev = () => {
    setCurrentPageIndex((i) => Math.max(0, i - (isSinglePageView ? 1 : 2)));
  };

  const handleNext = () => {
    const step = isSinglePageView ? 1 : 2;
    if (currentPageIndex + step < totalSpreads) {
      setCurrentPageIndex((i) => i + step);
    }
  };

  const handleNavigateToPage = (index: number) => {
    // index is the 0-based page index
    if (isSinglePageView) {
      setCurrentPageIndex(index + 1); // 1-based since 0 is cover
    } else {
      const spreadIndex = index + 1;
      setCurrentPageIndex(
        spreadIndex % 2 === 0 ? spreadIndex : spreadIndex - 1,
      );
    }
  };

  /* ---- Drag / Reorganize ---- */
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
  const handleCardSelect = (
    card: Card,
    state: SlotState,
    language?: "JP" | "EN",
  ) => {
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
          isSinglePageView={isSinglePageView}
          onToggleSinglePageView={() => setIsSinglePageView(!isSinglePageView)}
          onPrev={handlePrev}
          onNext={handleNext}
          onAddPage={() => addPage()}
          onToggleReorganize={() => setIsReorganizeMode((m) => !m)}
          onOpenCustomCard={() => setIsCustomCardOpen(true)}
          onOpenPageManager={() => setIsPageManagerOpen(true)}
        />

        <div className="relative">
          {/* Outer binder frame */}
          <div className="relative bg-[#0D1018] rounded-[2.5rem] border border-white/6 shadow-2xl overflow-hidden">
            {/* The spread pages - with swipe support */}
            <motion.div
              drag={!isReorganizeMode && isTouchDevice ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragMomentum={false}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
              onDragEnd={(_, info) => {
                const threshold = 50;
                if (info.offset.x > threshold) {
                  handlePrev();
                } else if (info.offset.x < -threshold) {
                  handleNext();
                }
              }}
              className="flex flex-col lg:flex-row gap-0 will-change-transform"
            >
              {/* Left Page — null on the very first spread (cover) */}
              {!isSinglePageView &&
                (leftPage ? (
                  <AlbumPagePanel
                    page={leftPage}
                    pageNumber={currentPageIndex}
                    isReorganizeMode={isReorganizeMode}
                    dragSource={dragSource}
                    dragTarget={dragTarget}
                    onOpenSearch={handleOpenSearch}
                    onClearSlot={clearSlot}
                    onOpenWishlistUrls={(pageId, slot) => setWishlistCtx({ pageId, slot })}
                    onOpenCardDetails={(card, pageId, slotId, currentState, currentLanguage, wishlistUrls) =>
                      setDetailCtx({ card, pageId, slotId, currentState, currentLanguage, wishlistUrls })
                    }
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  />
                ) : (
                  <CoverPlaceholder />
                ))}

              {/* Spine */}
              {!isSinglePageView && (
                <div className="hidden lg:flex flex-col items-center justify-between py-16 px-3 bg-spine gap-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="ring-hole" />
                  ))}
                </div>
              )}

              {/* Right Page — null after the last real page (back cover) */}
              {rightPage ? (
                <AlbumPagePanel
                  page={rightPage}
                  pageNumber={isSinglePageView ? currentPageIndex : currentPageIndex + 1}
                  isReorganizeMode={isReorganizeMode}
                  dragSource={dragSource}
                  dragTarget={dragTarget}
                  onOpenSearch={handleOpenSearch}
                  onClearSlot={clearSlot}
                  onOpenWishlistUrls={(pageId, slot) => setWishlistCtx({ pageId, slot })}
                  onOpenCardDetails={(card, pageId, slotId, currentState, currentLanguage, wishlistUrls) =>
                    setDetailCtx({ card, pageId, slotId, currentState, currentLanguage, wishlistUrls })
                  }
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ) : isSinglePageView && currentPageIndex === 0 ? (
                <CoverPlaceholder />
              ) : (
                <EmptyPagePlaceholder onAddPage={() => addPage()} />
              )}
            </motion.div>
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
          wishlistUrls={detailCtx.wishlistUrls}
          isOpen={!!detailCtx}
          onClose={() => setDetailCtx(null)}
          onOpenWishlistUrls={() => {
            const slot = album.pages
              .find((p) => p.pageId === detailCtx.pageId)
              ?.slots.find((s) => s.slotId === detailCtx.slotId);
            if (slot) setWishlistCtx({ pageId: detailCtx.pageId, slot });
            setDetailCtx(null);
          }}
        />
      )}
    </main>
  );
}

/** Shown as the left page of the very first spread (blank inside-cover). */
function CoverPlaceholder() {
  return (
    <div className="flex-1 bg-leather min-h-[640px] lg:min-h-[700px] flex items-center justify-center" />
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
