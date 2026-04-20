"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Lock, User, ChevronLeft, ChevronRight } from "lucide-react";
import AlbumSlotCard from "@/components/album/AlbumSlotCard";
import type { Album, AlbumPage, Card, AlbumSlot } from "@/types";
import CardDetailsModal from "@/components/CardDetailsModal";
import WishlistUrlsModal from "@/components/album/WishlistUrlsModal";

type PublicUser = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

export default function PublicAlbumPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [username, setUsername] = useState<string>("");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);
  const [selectedCard, setSelectedCard] = useState<{
    card: Card;
    language?: "JP" | "EN";
    wishlistUrls?: any[];
  } | null>(null);
  const [wishlistCtx, setWishlistCtx] = useState<{
    pageId: string;
    slot: AlbumSlot;
  } | null>(null);

  useEffect(() => {
    params.then((p) => setUsername(p.username));
  }, [params]);

  useEffect(() => {
    if (!username) return;
    fetch(`/api/albums/${username}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setUser(data.user);
          setAlbum(data.album);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [username]);

  useEffect(() => {
    const handleOpenWishlist = (e: CustomEvent) => {
      const { pageId, slot } = e.detail;
      if (pageId && slot) {
        setWishlistCtx({ pageId, slot });
      }
    };
    window.addEventListener(
      "open-wishlist-urls",
      handleOpenWishlist as EventListener,
    );
    return () =>
      window.removeEventListener(
        "open-wishlist-urls",
        handleOpenWishlist as EventListener,
      );
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center animate-pulse">
          <BookOpen size={24} className="text-gold" />
        </div>
      </div>
    );
  }

  if (notFound || !album || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-leather border border-white/8 flex items-center justify-center mx-auto">
            <Lock size={28} className="text-zinc-700" />
          </div>
          <p className="font-cinzel text-zinc-500 font-bold uppercase tracking-widest text-sm">
            Álbum no encontrado o privado
          </p>
        </div>
      </div>
    );
  }

  const totalPages = album.pages.length;
  const totalSpreads = totalPages + 1;
  const leftPage = album.pages[currentPageIndex - 1] ?? null;
  const rightPage = album.pages[currentPageIndex] ?? null;

  const handlePrev = () => setCurrentPageIndex((i) => Math.max(0, i - 2));
  const handleNext = () => {
    if (currentPageIndex + 2 < totalSpreads) setCurrentPageIndex((i) => i + 2);
  };

  const ownedCount = album.pages.reduce(
    (acc, p) => acc + p.slots.filter((s) => s.state === "OWNED").length,
    0,
  );
  const wishlistCount = album.pages.reduce(
    (acc, p) => acc + p.slots.filter((s) => s.state === "WISHLIST").length,
    0,
  );

  return (
    <main className="min-h-screen pt-20 pb-20 px-4 md:px-8">
      <div className="max-w-375 mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <User size={26} className="text-gold" />
            </div>
            <div>
              <h1 className="font-cinzel text-2xl font-black text-white">
                {user.name}
              </h1>
              <p className="text-zinc-500 text-sm font-mono">
                @{user.username}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-5 py-2.5 bg-leather border border-white/8 rounded-2xl">
              <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">
                Colección
              </div>
              <div className="font-cinzel text-xl font-bold text-gold">
                {ownedCount}
              </div>
            </div>
            <div className="text-center px-5 py-2.5 bg-leather border border-white/8 rounded-2xl">
              <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">
                Wishlist
              </div>
              <div className="font-cinzel text-xl font-bold text-zinc-300">
                {wishlistCount}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrev}
            disabled={currentPageIndex === 0}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-leather border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
              Anterior
            </span>
          </button>
          <div className="bg-leather border border-white/8 px-6 py-2 rounded-2xl">
            <div className="text-[9px] font-black uppercase text-zinc-600 tracking-widest text-center mb-0.5">
              Página
            </div>
            <div className="font-cinzel text-lg font-bold text-white text-center">
              {currentPageIndex + 1}
            </div>
          </div>
          <button
            onClick={handleNext}
            disabled={currentPageIndex + 2 >= totalSpreads}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-leather border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
              Siguiente
            </span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Binder spread — read only */}
        <div className="relative bg-[#0D1018] rounded-[2.5rem] border border-white/6 shadow-2xl overflow-hidden">
          <motion.div
            drag={isTouchDevice ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              const threshold = 50;
              if (info.offset.x > threshold) {
                handlePrev();
              } else if (info.offset.x < -threshold) {
                handleNext();
              }
            }}
            className="flex flex-col lg:flex-row gap-0"
          >
            {/* Left page */}
            {leftPage ? (
              <ReadOnlyPage
                page={leftPage}
                pageNumber={currentPageIndex}
                onCardClick={(card, language, wishlistUrls) =>
                  setSelectedCard({ card, language, wishlistUrls })
                }
                onOpenWishlistUrls={(pageId, slot) =>
                  setWishlistCtx({ pageId, slot })
                }
              />
            ) : (
              <CoverPlaceholder />
            )}

            {/* Spine */}
            <div className="hidden lg:flex flex-col items-center justify-between py-16 px-3 bg-spine gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="ring-hole" />
              ))}
            </div>

            {/* Right page */}
            {rightPage ? (
              <ReadOnlyPage
                page={rightPage}
                pageNumber={currentPageIndex + 1}
                onCardClick={(card, language, wishlistUrls) =>
                  setSelectedCard({ card, language, wishlistUrls })
                }
                onOpenWishlistUrls={(pageId, slot) =>
                  setWishlistCtx({ pageId, slot })
                }
              />
            ) : (
              <div className="flex-1 bg-leather-light min-h-160 flex items-center justify-center">
                <p className="font-cinzel text-[11px] text-zinc-700 tracking-widest uppercase">
                  Fin del Álbum
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {selectedCard && (
        <CardDetailsModal
          card={selectedCard.card}
          currentLanguage={selectedCard.language}
          wishlistUrls={selectedCard.wishlistUrls}
          isOpen
          onClose={() => setSelectedCard(null)}
          readOnly
        />
      )}

      {wishlistCtx && (
        <WishlistUrlsModal
          isOpen={!!wishlistCtx}
          onClose={() => setWishlistCtx(null)}
          pageId={wishlistCtx.pageId}
          slot={wishlistCtx.slot}
          readOnly
        />
      )}
    </main>
  );
}

function ReadOnlyPage({
  page,
  pageNumber,
  onCardClick,
  onOpenWishlistUrls,
}: {
  page: AlbumPage;
  pageNumber: number;
  onCardClick: (
    card: Card,
    language?: "JP" | "EN",
    wishlistUrls?: any[],
  ) => void;
  onOpenWishlistUrls: (pageId: string, slot: AlbumSlot) => void;
}) {
  return (
    <div className="flex-1 bg-leather min-h-160 lg:min-h-175">
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
      <div className="grid grid-cols-4 gap-4 p-8">
        {page.slots.map((slot, index) => (
          <AlbumSlotCard
            key={slot.slotId}
            slot={slot}
            slotIndex={index}
            pageId={page.pageId}
            isReorganizeMode={false}
            isDragSource={false}
            isDragTarget={false}
            readOnly
            onOpenSearch={() => {}}
            onClearSlot={() => {}}
            onOpenWishlistUrls={() => onOpenWishlistUrls(page.pageId, slot)}
            onOpenCardDetails={(card) =>
              onCardClick(card, slot.language, slot.wishlistUrls)
            }
            onDragStart={() => {}}
            onDragOver={() => {}}
            onDrop={() => {}}
            onDragEnd={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

function CoverPlaceholder() {
  return (
    <div className="flex-1 bg-leather min-h-160 lg:min-h-175 flex items-center justify-center"></div>
  );
}
