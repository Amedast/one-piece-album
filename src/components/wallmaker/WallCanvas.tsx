"use client";

import { useState } from "react";
import { useWallmaker } from "@/context/WallmakerContext";
import WallSlotItem from "@/components/wallmaker/WallSlotItem";
import type { Card } from "@/types";

interface WallCanvasProps {
  onOpenSearch: (slotId: string) => void;
  onOpenCardDetails?: (card: Card) => void;
}

export default function WallCanvas({
  onOpenSearch,
  onOpenCardDetails,
}: WallCanvasProps) {
  const { wall, clearSlot, swapSlots } = useWallmaker();

  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  const maxWidthClass =
    wall.columns === 2
      ? "max-w-md"
      : wall.columns === 3
        ? "max-w-2xl"
        : wall.columns === 4
          ? "max-w-4xl"
          : "max-w-5xl";

  const handleDragStart = (slotId: string) => {
    setDragSourceId(slotId);
    setDragTargetId(null);
  };

  const handleDragOver = (slotId: string) => {
    if (dragSourceId && dragSourceId !== slotId) {
      setDragTargetId(slotId);
    }
  };

  const handleDrop = () => {
    if (dragSourceId && dragTargetId) {
      swapSlots(dragSourceId, dragTargetId);
    }
    setDragSourceId(null);
    setDragTargetId(null);
  };

  const handleDragEnd = () => {
    setDragSourceId(null);
    setDragTargetId(null);
  };

  return (
    <div className="w-full flex justify-center py-6">
      {/* Div 1: Marco exterior — color #0f0f0f, borde y padding */}
      <div
        className={`w-full ${maxWidthClass} rounded-3xl`}
        style={{
          backgroundColor: "#000000",
          border: "2px solid #3a3a3a",
          padding: "20px",
        }}
      >
        {/* Div 2: Marco interior — borde visible */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "2px solid #2a2a2a", padding: "5px" }}
        >
          {/* Rejilla de cartas */}
          <div
            className="grid gap-0.5 overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${wall.columns || 4}, minmax(0, 1fr))`,
            }}
          >
            {wall.slots.map((slot, index) => (
              <WallSlotItem
                key={slot.slotId}
                slot={slot}
                slotIndex={index}
                isDragSource={dragSourceId === slot.slotId}
                isDragTarget={dragTargetId === slot.slotId}
                onOpenSearch={onOpenSearch}
                onClearSlot={clearSlot}
                onOpenCardDetails={onOpenCardDetails}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
