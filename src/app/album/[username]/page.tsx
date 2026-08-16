"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Lock, User, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import AlbumPagePanel from "@/components/album/AlbumPagePanel";
import type { Album, AlbumSlot, AlbumSummary, Card, WishlistUrl } from "@/types";
import CardDetailsModal from "@/components/CardDetailsModal";
import WishlistUrlsModal from "@/components/album/WishlistUrlsModal";

type PublicUser = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

export default function PublicAlbumPageWrapper({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={28} className="text-gold animate-spin" />
        </div>
      }
    >
      <PublicAlbumContent params={params} />
    </Suspense>
  );
}

function PublicAlbumContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryAlbumId = searchParams.get("albumId");

  const [username, setUsername] = useState<string>("");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [albumList, setAlbumList] = useState<AlbumSummary[]>([]);
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const [selectedCard, setSelectedCard] = useState<{
    card: Card;
    language?: "JP" | "EN";
    wishlistUrls?: WishlistUrl[];
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
    setIsLoading(true);
    const url = queryAlbumId
      ? `/api/albums/${username}?albumId=${queryAlbumId}`
      : `/api/albums/${username}`;

    fetch(url)
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
          setAlbumList(data.albums || []);
          setCurrentPageIndex(0);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [username, queryAlbumId]);

  const handleSelectAlbum = (albumId: string) => {
    if (albumId === album?.id) return;
    router.push(`/album/${username}?albumId=${albumId}`);
  };

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
    0
  );
  const wishlistCount = album.pages.reduce(
    (acc, p) => acc + p.slots.filter((s) => s.state === "WISHLIST").length,
    0
  );

  return (
    <main className="min-h-screen pt-20 pb-20 px-4 md:px-8">
      <div className="max-w-[1500px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <User size={26} className="text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-2xl font-black text-white">
                  {user.name}
                </h1>
                <span className="text-xs text-gold/80 font-mono">
                  @{user.username}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-crimson mt-0.5">
                Colección pública de One Piece TCG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 bg-leather border border-white/8 rounded-2xl">
              <div className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                Colección
              </div>
              <div className="font-cinzel text-lg font-bold text-gold">
                {ownedCount}
              </div>
            </div>
            <div className="text-center px-4 py-2 bg-leather border border-white/8 rounded-2xl">
              <div className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                Wishlist
              </div>
              <div className="font-cinzel text-lg font-bold text-zinc-300">
                {wishlistCount}
              </div>
            </div>
          </div>
        </div>

        {/* Multi-album selector tabs (if user has > 1 public album) */}
        {albumList.length > 1 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <div className="text-xs font-black uppercase text-zinc-500 tracking-wider mr-2 shrink-0">
              Álbumes:
            </div>
            {albumList.map((a) => {
              const isSelected = a.id === album.id;
              return (
                <button
                  key={a.id}
                  onClick={() => handleSelectAlbum(a.id)}
                  className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                    isSelected
                      ? "bg-gold text-obsidian border-gold shadow-md shadow-gold/20"
                      : "bg-leather border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
                  }`}
                >
                  <BookOpen size={14} />
                  <span>{a.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? "bg-obsidian/30 text-obsidian font-black" : "bg-white/5 text-zinc-400"}`}>
                    {a.ownedCount ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Current album info banner */}
        <div className="mb-6 flex items-center justify-between bg-leather border border-white/8 rounded-2xl px-5 py-3">
          <div>
            <h2 className="font-cinzel text-lg font-bold text-white">
              {album.title}
            </h2>
            {album.description && (
              <p className="text-xs text-zinc-400 font-crimson mt-0.5">
                {album.description}
              </p>
            )}
          </div>
          <div className="text-xs font-bold text-zinc-500 font-mono">
            Página {currentPageIndex + 1} de {totalPages}
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
        <div className="relative bg-[#0D1018] rounded-xl sm:rounded-2xl lg:rounded-3xl border border-white/6 shadow-2xl overflow-hidden">
          <motion.div
            drag={isTouchDevice ? "x" : false}
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
            {/* Left page */}
            {leftPage ? (
              <AlbumPagePanel
                page={leftPage}
                pageNumber={currentPageIndex}
                size={album.size}
                readOnly
                variant="tall"
                onOpenWishlistUrls={(pageId, slot) => setWishlistCtx({ pageId, slot })}
                onOpenCardDetails={(card, _pageId, _slotId, _state, language, wishlistUrls) =>
                  setSelectedCard({ card, language, wishlistUrls })
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
              <AlbumPagePanel
                page={rightPage}
                pageNumber={currentPageIndex + 1}
                size={album.size}
                readOnly
                variant="tall"
                onOpenWishlistUrls={(pageId, slot) => setWishlistCtx({ pageId, slot })}
                onOpenCardDetails={(card, _pageId, _slotId, _state, language, wishlistUrls) =>
                  setSelectedCard({ card, language, wishlistUrls })
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
          onOpenWishlistUrls={() => {
            if (selectedCard.wishlistUrls && selectedCard.wishlistUrls.length > 0) {
              const syntheticSlot: AlbumSlot = {
                slotId: "readonly",
                state: "WISHLIST",
                cardData: selectedCard.card,
                wishlistUrls: selectedCard.wishlistUrls,
                language: selectedCard.language,
              };
              setWishlistCtx({ pageId: "readonly", slot: syntheticSlot });
              setSelectedCard(null);
            }
          }}
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

function CoverPlaceholder() {
  return (
    <div className="flex-1 bg-leather min-h-160 lg:min-h-175 flex items-center justify-center" />
  );
}
