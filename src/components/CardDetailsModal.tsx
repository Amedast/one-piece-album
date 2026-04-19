"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, SlotState } from "@/types";
import {
  X,
  Shield,
  Zap,
  Swords,
  Info,
  Bookmark,
  CheckCircle2,
  Plus,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  Grid,
} from "lucide-react";
import { useAlbum } from "@/context/AlbumContext";
import { twMerge } from "tailwind-merge";

interface CardDetailsModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
  // When opened from album slot (card click)
  pageId?: string;
  slotId?: string;
  currentSlotState?: "OWNED" | "WISHLIST";
  currentLanguage?: "JP" | "EN";
}

export default function CardDetailsModal({
  card,
  isOpen,
  onClose,
  readOnly = false,
  pageId: slotPageId,
  slotId,
  currentSlotState,
  currentLanguage,
}: CardDetailsModalProps) {
  const { album, updateSlot, addPage, clearSlot } = useAlbum();

  // When opened from a slot, we can toggle its state
  const isSlotContext = !!(slotPageId && slotId && currentSlotState);
  const [slotState, setSlotState] = useState<"OWNED" | "WISHLIST">(
    currentSlotState || "OWNED",
  );
  const [slotLanguage, setSlotLanguage] = useState<"JP" | "EN" | undefined>(
    currentLanguage,
  );
  const [stateChanged, setStateChanged] = useState(false);

  // When opened from database (add to album)
  const [addState, setAddState] = useState<"OWNED" | "WISHLIST">("OWNED");
  const [addLanguage, setAddLanguage] = useState<"JP" | "EN">("EN");
  const [placementType, setPlacementType] = useState<
    "FIRST_AVAILABLE" | "CONCRETE"
  >("FIRST_AVAILABLE");
  const [concretePos, setConcretePos] = useState<{
    pageId: string;
    slotId: string;
    pageTitle: string;
    slotIndex: number;
  } | null>(null);
  const [viewMiniAlbum, setViewMiniAlbum] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);

  const handleToggleSlotState = (
    newState: "OWNED" | "WISHLIST",
    newLang?: "JP" | "EN",
  ) => {
    if (!slotPageId || !slotId || !card) return;
    const finalState = newState;
    const finalLang = newLang !== undefined ? newLang : slotLanguage;

    setSlotState(finalState);
    if (newLang !== undefined) setSlotLanguage(newLang);

    updateSlot(slotPageId, slotId, card, finalState, finalLang);
    setStateChanged(true);
    setTimeout(() => setStateChanged(false), 1500);
  };

  const handleRemove = () => {
    if (slotPageId && slotId) {
      clearSlot(slotPageId, slotId);
      onClose();
    }
  };

  const handleOpenUrls = () => {
    if (slotPageId && slotId) {
      window.dispatchEvent(
        new CustomEvent("open-wishlist-urls", {
          detail: { pageId: slotPageId, slotId },
        }),
      );
      onClose();
    }
  };

  const isRare =
    card.rarity === "SR" || card.rarity === "SEC" || card.rarity === "SP CARD";
  const imgSrc = card.imageData || card.url;

  // Check if card is already in album
  const existingSlots = album.pages.flatMap((p) =>
    p.slots
      .filter((s) => s.cardId === card.id)
      .map((s) => ({ ...s, pageTitle: p.title })),
  );
  const isAlreadyInAlbum = existingSlots.length > 0;

  const handleAddToAlbum = () => {
    let targetPageId = "";
    let targetSlotId = "";

    if (placementType === "CONCRETE" && concretePos) {
      targetPageId = concretePos.pageId;
      targetSlotId = concretePos.slotId;
    } else {
      const emptyPage = album.pages.find((p) =>
        p.slots.some((s) => s.state === "EMPTY"),
      );
      if (!emptyPage) return;
      targetPageId = emptyPage.pageId;
      targetSlotId = emptyPage.slots.find((s) => s.state === "EMPTY")!.slotId;
    }

    updateSlot(targetPageId, targetSlotId, card, addState, addLanguage);
    setAddSuccess(true);
    setTimeout(() => {
      setAddSuccess(false);
      // Reset placement to FIRST_AVAILABLE if it was just placed in concrete slot?
      // No need, user might close the modal. If they add multiple, let them choose.
    }, 2000);
  };

  const getPagesWithSpace = () =>
    album.pages.filter((p) => p.slots.some((s) => s.state === "EMPTY"));

  const rarityColors: Record<string, string> = {
    SR: "text-gold border-gold/30 bg-gold/10",
    SEC: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    "SP CARD": "text-purple-400 border-purple-400/30 bg-purple-400/10",
    L: "text-red-400 border-red-400/30 bg-red-400/10",
    R: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    UC: "text-zinc-300 border-zinc-500/30 bg-zinc-500/10",
    C: "text-zinc-500 border-zinc-700/30 bg-zinc-700/10",
    P: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/92 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl bg-leather border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black flex flex-col md:flex-row max-h-[95vh] md:max-h-[85vh]"
          >
            {/* Left: Card art */}
            <div className="w-full md:w-[42%] p-4 md:p-6 lg:p-3 shrink-0 bg-obsidian flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative">
              {/* Rare glow bg */}
              {isRare && (
                <div className="absolute inset-0 bg-linear-to-br from-gold/5 to-transparent pointer-events-none" />
              )}
              <motion.div
                className={twMerge(
                  "relative aspect-[63/88] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10",
                  "w-auto max-h-[30vh] sm:max-h-[40vh] md:max-h-none md:w-full md:max-w-96",
                  isRare && "ring-gold/30",
                )}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${imgSrc})` }}
                />
                {isRare && (
                  <div className="absolute inset-0 bg-linear-to-tr from-gold/10 via-transparent to-white/5 pointer-events-none mix-blend-overlay" />
                )}
                {card.isCustom && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500/80 rounded-lg text-[9px] font-black uppercase text-white backdrop-blur-sm">
                    Custom
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right: Details / Mini Album */}
            {viewMiniAlbum ? (
              <div className="flex-1 flex flex-col p-5 md:p-10 overflow-hidden">
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 shrink-0">
                  <button
                    onClick={() => setViewMiniAlbum(false)}
                    className="p-2 md:p-2.5 bg-leather-light rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={18} className="md:w-5 md:h-5" />
                  </button>
                  <div>
                    <h2 className="font-cinzel text-lg md:text-2xl font-bold text-white leading-tight">
                      Seleccionar Hueco
                    </h2>
                    <p className="text-zinc-500 text-[10px] md:text-xs mt-0.5 font-bold uppercase tracking-widest">
                      Mini Álbum
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="cursor-pointer p-2 md:p-2.5 bg-leather-light rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all shrink-0 ml-auto"
                  >
                    <X size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                  {album.pages.map((page) => {
                    const hasEmpty = page.slots.some(
                      (s) => s.state === "EMPTY",
                    );
                    return (
                      <div
                        key={page.pageId}
                        className={hasEmpty ? "" : "opacity-30"}
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                          <h3 className="text-sm font-bold text-zinc-300">
                            {page.title}
                          </h3>
                          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                            {
                              page.slots.filter((s) => s.state === "EMPTY")
                                .length
                            }{" "}
                            libres
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {page.slots.map((slot, index) => {
                            const isSelected =
                              placementType === "CONCRETE" &&
                              concretePos?.slotId === slot.slotId;
                            const isEmpty = slot.state === "EMPTY";
                            return (
                              <button
                                key={slot.slotId}
                                disabled={!isEmpty}
                                onClick={() => {
                                  setPlacementType("CONCRETE");
                                  setConcretePos({
                                    pageId: page.pageId,
                                    slotId: slot.slotId,
                                    pageTitle: page.title,
                                    slotIndex: index,
                                  });
                                  setViewMiniAlbum(false);
                                }}
                                className={twMerge(
                                  "aspect-[63/88] rounded flex items-center justify-center border transition-all relative group overflow-hidden",
                                  isEmpty
                                    ? "cursor-pointer border-white/20 bg-white/5 hover:border-gold hover:bg-white/10"
                                    : "cursor-not-allowed border-white/5 bg-zinc-900/50",
                                  isSelected &&
                                    "border-gold bg-gold/10 ring-2 ring-gold/20 !opacity-100", // Override opacity if selected (though shouldn't be full page normally)
                                )}
                              >
                                {isSelected ? (
                                  <CheckCircle2
                                    size={16}
                                    className="text-gold"
                                  />
                                ) : isEmpty ? (
                                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[8px] font-black uppercase text-gold/70 transition-opacity">
                                    <Plus size={10} />
                                  </div>
                                ) : (
                                  <div
                                    className="absolute inset-0 bg-cover bg-center opacity-30 grayscale"
                                    style={{
                                      backgroundImage: slot.cardData?.imageData
                                        ? `url(${slot.cardData.imageData})`
                                        : slot.cardData?.url
                                          ? `url(${slot.cardData.url})`
                                          : "none",
                                    }}
                                  ></div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {album.pages.length === 0 && (
                    <div className="text-center py-10 text-zinc-500 text-sm">
                      No hay páginas en el álbum todavía.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-5 md:p-10 overflow-y-auto">
                {/* Close */}
                <div className="flex items-start justify-between mb-4 md:mb-6 shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-leather-light rounded-lg text-[9px] font-black text-zinc-400 border border-white/8 tracking-wider font-mono">
                        {card.serial}
                      </span>
                      <span
                        className={twMerge(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black border tracking-wider",
                          rarityColors[card.rarity] ||
                            "text-zinc-500 border-zinc-700/30 bg-zinc-700/10",
                        )}
                      >
                        {card.rarity}
                      </span>
                      {card.color && (
                        <span className="px-2.5 py-1 bg-leather-light rounded-lg text-[9px] font-black text-zinc-500 border border-white/8">
                          {card.color}
                        </span>
                      )}
                    </div>
                    <h2 className="font-cinzel text-2xl md:text-4xl font-bold text-white leading-tight">
                      {card.name}
                    </h2>
                    <p className="text-zinc-500 text-[10px] md:text-xs mt-1 font-bold uppercase tracking-widest">
                      {card.type}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="cursor-pointer p-2 md:p-2.5 bg-leather-light rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all shrink-0 ml-4"
                  >
                    <X size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <StatBox
                    icon={<Swords size={14} />}
                    label="Power"
                    value={card.power ?? "—"}
                    color="text-red-400"
                  />
                  <StatBox
                    icon={<Shield size={14} />}
                    label="Counter"
                    value={card.counter ?? "—"}
                    color="text-blue-400"
                  />
                  <StatBox
                    icon={<Zap size={14} />}
                    label="Cost"
                    value={card.cost ?? "—"}
                    color="text-gold"
                  />
                  <StatBox
                    icon={<Info size={14} />}
                    label="Attr."
                    value={card.attribute ?? "—"}
                    color="text-zinc-400"
                  />
                </div>

                {/* Effect */}
                {card.effect && (
                  <div className="mb-8">
                    <h3 className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-3">
                      Efecto / Habilidad
                    </h3>
                    <div className="bg-obsidian rounded-2xl p-5 border border-white/6">
                      <p className="text-sm text-zinc-300 leading-relaxed font-crimson italic">
                        {card.effect}
                      </p>
                    </div>
                  </div>
                )}

                {/* Feature / Trigger */}
                {(card.feature || card.trigger) && (
                  <div className="mb-8 space-y-2">
                    {card.feature && (
                      <p className="text-xs text-zinc-500 font-crimson">
                        <span className="font-black text-zinc-400 not-italic">
                          Característica:{" "}
                        </span>
                        {card.feature}
                      </p>
                    )}
                    {card.trigger && (
                      <p className="text-xs text-zinc-500 font-crimson">
                        <span className="font-black text-zinc-400 not-italic">
                          Trigger:{" "}
                        </span>
                        {card.trigger}
                      </p>
                    )}
                  </div>
                )}

                {/* In album status */}
                {isAlreadyInAlbum && (
                  <div className="mb-6 bg-gold/5 border border-gold/20 rounded-2xl p-4 flex items-center gap-3">
                    <BookOpen size={16} className="text-gold shrink-0" />
                    <div>
                      <p className="text-gold text-xs font-black uppercase tracking-wider">
                        Ya en tu álbum
                      </p>
                      <p className="text-zinc-500 text-[10px] font-crimson mt-0.5">
                        {existingSlots
                          .map((s) => (s as any).pageTitle)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {/* ---- SLOT CONTEXT: change owned / wishlist ---- */}
                {!readOnly && isSlotContext ? (
                  <div className="mt-auto pt-6 border-t border-white/6 space-y-4">
                    <h3 className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.3em]">
                      Estado en el Álbum
                    </h3>
                    <div className="flex gap-2">
                      <StateButton
                        active={slotState === "OWNED"}
                        onClick={() => handleToggleSlotState("OWNED")}
                        icon={<CheckCircle2 size={16} />}
                        label="Poseída"
                        activeClass="cursor-pointer bg-gold text-obsidian border-gold"
                      />
                      <StateButton
                        active={slotState === "WISHLIST"}
                        onClick={() => handleToggleSlotState("WISHLIST")}
                        icon={<Bookmark size={16} />}
                        label="Wishlist"
                        activeClass="cursor-pointer bg-zinc-100 text-zinc-900 border-white"
                      />
                    </div>

                    {/* Slot language selector */}
                    <div className="flex gap-2">
                      <StateButton
                        active={slotLanguage === "EN"}
                        onClick={() => handleToggleSlotState(slotState, "EN")}
                        icon={null}
                        label="EN"
                        activeClass="cursor-pointer bg-blue-500/20 text-blue-400 border-blue-500/50"
                      />
                      <StateButton
                        active={slotLanguage === "JP"}
                        onClick={() => handleToggleSlotState(slotState, "JP")}
                        icon={null}
                        label="JP"
                        activeClass="cursor-pointer bg-purple-500/20 text-purple-400 border-purple-500/50"
                      />
                    </div>

                    {/* Acciones extra: Eliminar y Ver Enlaces (si es wishlist) */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleRemove}
                        className="cursor-pointer flex-1 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-black uppercase tracking-wider hover:bg-red-500/20 transition-all"
                      >
                        Eliminar del álbum
                      </button>
                      {slotState === "WISHLIST" && (
                        <button
                          onClick={handleOpenUrls}
                          className="cursor-pointer flex-1 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-black uppercase tracking-wider hover:bg-blue-500/20 transition-all"
                        >
                          Ver Enlaces
                        </button>
                      )}
                    </div>

                    {stateChanged && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 justify-center mt-2"
                      >
                        <CheckCircle2 size={14} /> Estado actualizado
                      </motion.p>
                    )}
                  </div>
                ) : !readOnly ? (
                  /* ---- DATABASE CONTEXT: add to album ---- */
                  <div className="mt-auto pt-6 border-t border-white/6 space-y-4">
                    <h3 className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.3em]">
                      Añadir al Álbum
                    </h3>

                    {/* State selector */}
                    <div className="flex gap-2">
                      <StateButton
                        active={addState === "OWNED"}
                        onClick={() => setAddState("OWNED")}
                        icon={<CheckCircle2 size={16} />}
                        label="Poseída"
                        activeClass="cursor-pointer bg-gold text-obsidian border-gold"
                      />
                      <StateButton
                        active={addState === "WISHLIST"}
                        onClick={() => setAddState("WISHLIST")}
                        icon={<Bookmark size={16} />}
                        label="Wishlist"
                        activeClass="cursor-pointer bg-zinc-100 text-zinc-900 border-white"
                      />
                    </div>

                    {/* Language selector */}
                    <div className="flex gap-2">
                      <StateButton
                        active={addLanguage === "EN"}
                        onClick={() => setAddLanguage("EN")}
                        icon={null}
                        label="EN"
                        activeClass="cursor-pointer bg-blue-500/20 text-blue-400 border-blue-500/50"
                      />
                      <StateButton
                        active={addLanguage === "JP"}
                        onClick={() => setAddLanguage("JP")}
                        icon={null}
                        label="JP"
                        activeClass="cursor-pointer bg-red-500/20 text-red-400 border-red-500/50"
                      />
                    </div>

                    {/* Page selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowPageSelector(!showPageSelector)}
                        className="cursor-pointer w-full flex items-center justify-between px-4 py-3 bg-leather-light border border-white/10 rounded-xl text-sm text-zinc-300 hover:border-white/20 transition-all"
                      >
                        <span className="font-crimson">
                          {placementType === "CONCRETE" && concretePos
                            ? `${concretePos.pageTitle} (Hueco ${concretePos.slotIndex + 1})`
                            : "Primer hueco disponible"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={twMerge(
                            "text-zinc-500 transition-transform",
                            showPageSelector && "rotate-180",
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {showPageSelector && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-leather border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10"
                          >
                            <button
                              onClick={() => {
                                setPlacementType("FIRST_AVAILABLE");
                                setConcretePos(null);
                                setShowPageSelector(false);
                              }}
                              className="cursor-pointer w-full px-4 py-3.5 text-left text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-crimson flex justify-between items-center"
                            >
                              <span>Primer hueco disponible</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowPageSelector(false);
                                setViewMiniAlbum(true);
                              }}
                              className="cursor-pointer w-full px-4 py-3.5 text-left text-sm text-gold hover:text-gold-bright hover:bg-white/5 transition-colors font-crimson border-t border-white/5 flex justify-between items-center"
                            >
                              <span>Posición concreta...</span>
                              <Grid size={14} className="opacity-70" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Add button */}
                    <motion.button
                      onClick={handleAddToAlbum}
                      disabled={getPagesWithSpace().length === 0}
                      whileTap={{ scale: 0.97 }}
                      className={twMerge(
                        "w-full py-3.5 rounded-xl font-black uppercase text-sm tracking-wider transition-all duration-200 flex items-center justify-center gap-2",
                        addSuccess
                          ? "bg-emerald-500 text-white"
                          : "bg-gold text-obsidian hover:bg-gold-bright disabled:opacity-40 disabled:cursor-not-allowed",
                      )}
                    >
                      {addSuccess ? (
                        <>
                          <CheckCircle2 size={18} /> ¡Añadida!
                        </>
                      ) : (
                        <>
                          <Plus size={18} /> Añadir al Álbum
                        </>
                      )}
                    </motion.button>

                    {getPagesWithSpace().length === 0 && (
                      <button
                        onClick={() => addPage()}
                        className="cursor-pointer w-full py-2.5 border border-dashed border-white/10 rounded-xl text-xs text-zinc-500 hover:text-gold hover:border-gold/30 transition-all font-bold uppercase tracking-widest"
                      >
                        + Crear nueva página
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-leather-light border border-white/6 rounded-2xl p-3 flex flex-col items-center text-center hover:border-white/12 transition-all">
      <div className={twMerge("mb-1.5", color)}>{icon}</div>
      <div className="text-[8px] uppercase font-black text-zinc-600 tracking-widest mb-0.5">
        {label}
      </div>
      <div className="text-lg font-black text-white leading-tight font-cinzel">
        {value}
      </div>
    </div>
  );
}

function StateButton({
  active,
  onClick,
  icon,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        "cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-black uppercase tracking-wider transition-all",
        active
          ? activeClass
          : "bg-leather-light border-white/8 text-zinc-500 hover:border-white/15",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
