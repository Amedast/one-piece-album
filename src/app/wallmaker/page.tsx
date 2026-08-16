"use client";

import { useState } from "react";
import { WallmakerProvider, useWallmaker } from "@/context/WallmakerContext";
import WallToolbar from "@/components/wallmaker/WallToolbar";
import WallCanvas from "@/components/wallmaker/WallCanvas";
import CreateWallModal from "@/components/wallmaker/CreateWallModal";
import AlbumSearchModal from "@/components/AlbumSearchModal";
import CardDetailsModal from "@/components/CardDetailsModal";
import type { Card } from "@/types";
import { Frame, Sparkles, LayoutGrid } from "lucide-react";

function WallmakerContent() {
  const { wall, setSlotCard, isLoaded } = useWallmaker();

  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<Card | null>(null);

  const handleCardSelect = (card: Card) => {
    if (activeSlotId) {
      setSlotCard(activeSlotId, card);
      setActiveSlotId(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto animate-pulse">
            <Frame size={24} className="text-gold" />
          </div>
          <p className="text-zinc-500 text-sm font-crimson">
            Cargando tus cuadros...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1500px] mx-auto">
      {/* Page Title & Subtitle */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Wall<span className="text-gold">maker</span>
          </h1>
          <p className="text-zinc-400 font-crimson text-sm md:text-base mt-1">
            Diseña y previsualiza cuadros y posters personalizados con tus cartas favoritas.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <WallToolbar onOpenCreate={() => setIsCreateOpen(true)} />

      {/* Main Canvas with Frame Mockup */}
      <WallCanvas
        onOpenSearch={(slotId) => setActiveSlotId(slotId)}
        onOpenCardDetails={(card) => setDetailCard(card)}
      />

      {/* Modals */}
      <CreateWallModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <AlbumSearchModal
        isOpen={!!activeSlotId}
        onClose={() => setActiveSlotId(null)}
        onSelect={handleCardSelect}
        defaultState="OWNED"
      />

      {detailCard && (
        <CardDetailsModal
          card={detailCard}
          isOpen={!!detailCard}
          onClose={() => setDetailCard(null)}
        />
      )}
    </div>
  );
}

export default function WallmakerPage() {
  return (
    <main className="min-h-screen pt-24 pb-24 px-4 md:px-8 bg-obsidian">
      <WallmakerProvider>
        <WallmakerContent />
      </WallmakerProvider>
    </main>
  );
}
