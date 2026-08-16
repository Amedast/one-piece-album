"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type {
  Card,
  WallFrameStyle,
  WallPoster,
  WallPosterSummary,
  WallSlot,
} from "@/types";
import { useSession } from "@/lib/auth-client";

interface WallmakerContextType {
  wall: WallPoster;
  walls: WallPosterSummary[];
  isLoaded: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  zoom: number;
  setZoom: (z: number) => void;
  // Wall management
  switchWall: (id: string) => Promise<void>;
  createWall: (
    title: string,
    columns: number,
    rows: number,
    frameStyle?: WallFrameStyle
  ) => Promise<string | null>;
  updateWallMetadata: (
    id: string,
    data: { title?: string; frameStyle?: WallFrameStyle }
  ) => Promise<void>;
  deleteWall: (id: string) => Promise<boolean>;
  // Slot operations
  setSlotCard: (slotId: string, card: Card) => void;
  clearSlot: (slotId: string) => void;
  clearAllSlots: () => void;
  swapSlots: (sourceSlotId: string, targetSlotId: string) => void;
  setFrameStyle: (style: WallFrameStyle) => void;
  saveWallToServer: (targetWall?: WallPoster) => Promise<void>;
}

const WallmakerContext = createContext<WallmakerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "ohara_wallmaker_local_v1";

function generateSlots(cols: number, rows: number): WallSlot[] {
  return Array.from({ length: cols * rows }).map((_, i) => ({
    slotId: `slot-${Date.now()}-${i}`,
    position: i,
  }));
}

const DEFAULT_WALL: WallPoster = {
  id: "local-default",
  title: "Mi Cuadro #1",
  columns: 4,
  rows: 4,
  frameStyle: "obsidian",
  slots: generateSlots(4, 4),
};

export function WallmakerProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;

  const [wall, setWall] = useState<WallPoster>(DEFAULT_WALL);
  const [walls, setWalls] = useState<WallPosterSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [zoom, setZoom] = useState<number>(100);

  // ─── Load walls ───────────────────────────────────────────────────────────
  const loadUserWalls = useCallback(async (requestedWallId?: string) => {
    if (!user) {
      // Local storage for guests
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.wall) {
            setWall(parsed.wall);
            setWalls(parsed.walls || [
              {
                id: parsed.wall.id,
                title: parsed.wall.title,
                columns: parsed.wall.columns,
                rows: parsed.wall.rows,
                frameStyle: parsed.wall.frameStyle,
                totalSlots: parsed.wall.columns * parsed.wall.rows,
                filledCount: parsed.wall.slots.filter((s: WallSlot) => s.cardId !== undefined).length,
              },
            ]);
            setIsLoaded(true);
            return;
          }
        }
      } catch (e) {
        console.error("Error reading localStorage walls:", e);
      }

      setWall(DEFAULT_WALL);
      setWalls([
        {
          id: DEFAULT_WALL.id,
          title: DEFAULT_WALL.title,
          columns: DEFAULT_WALL.columns,
          rows: DEFAULT_WALL.rows,
          frameStyle: DEFAULT_WALL.frameStyle,
          totalSlots: DEFAULT_WALL.columns * DEFAULT_WALL.rows,
          filledCount: 0,
        },
      ]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    try {
      const url = requestedWallId
        ? `/api/walls?wallId=${requestedWallId}`
        : "/api/walls";
      const res = await fetch(url);
      const data = await res.json();

      if (data.wall) {
        setWall(data.wall);
      }
      if (Array.isArray(data.walls)) {
        setWalls(data.walls);
      }
    } catch (e) {
      console.error("Failed to load user walls:", e);
    } finally {
      setIsLoaded(true);
      setHasUnsavedChanges(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserWalls();
  }, [loadUserWalls]);

  // ─── Auto-track changes ───────────────────────────────────────────────────
  const isInitialLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded) {
      isInitialLoadedRef.current = false;
      return;
    }
    if (!isInitialLoadedRef.current) {
      isInitialLoadedRef.current = true;
      return;
    }
    setHasUnsavedChanges(true);

    // If guest, auto-save to localStorage
    if (!user) {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            wall,
            walls: [
              {
                id: wall.id,
                title: wall.title,
                columns: wall.columns,
                rows: wall.rows,
                frameStyle: wall.frameStyle,
                totalSlots: wall.columns * wall.rows,
                filledCount: wall.slots.filter((s) => s.cardId !== undefined).length,
              },
            ],
          })
        );
      } catch (e) {
        console.error("Local storage write error:", e);
      }
    }
  }, [wall, isLoaded, user]);

  // ─── Save wall to server ──────────────────────────────────────────────────
  const saveWallToServer = async (targetWall?: WallPoster) => {
    const wallToSave = targetWall || wall;
    if (!user) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/walls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wall: wallToSave }),
      });
      if (!res.ok) throw new Error("Failed to save wall");
      const data = await res.json();
      if (data.wallId && data.wallId !== wallToSave.id) {
        setWall((prev) => ({ ...prev, id: data.wallId }));
      }
      setHasUnsavedChanges(false);

      // Refresh list summaries
      const listRes = await fetch("/api/walls");
      const listData = await listRes.json();
      if (Array.isArray(listData.walls)) setWalls(listData.walls);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Switch active wall ───────────────────────────────────────────────────
  const switchWall = async (id: string) => {
    if (id === wall.id) return;
    if (hasUnsavedChanges && user) {
      try {
        await saveWallToServer();
      } catch (e) {
        console.error(e);
      }
    }
    await loadUserWalls(id);
  };

  // ─── Create new wall ──────────────────────────────────────────────────────
  const createWall = async (
    title: string,
    columns: number,
    rows: number,
    frameStyle: WallFrameStyle = "obsidian"
  ): Promise<string | null> => {
    const clampedCols = Math.min(Math.max(columns, 2), 6);
    const clampedRows = Math.min(Math.max(rows, 2), 6);
    const cleanTitle = title.trim() || "Nuevo Cuadro";

    if (!user) {
      const newId = `local-${Date.now()}`;
      const newWall: WallPoster = {
        id: newId,
        title: cleanTitle,
        columns: clampedCols,
        rows: clampedRows,
        frameStyle,
        slots: generateSlots(clampedCols, clampedRows),
      };
      setWall(newWall);
      setWalls((prev) => [
        {
          id: newId,
          title: cleanTitle,
          columns: clampedCols,
          rows: clampedRows,
          frameStyle,
          totalSlots: clampedCols * clampedRows,
          filledCount: 0,
        },
        ...prev,
      ]);
      return newId;
    }

    try {
      const res = await fetch("/api/walls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: cleanTitle,
          columns: clampedCols,
          rows: clampedRows,
          frameStyle,
        }),
      });

      if (!res.ok) throw new Error("Error creating wall");
      const data = await res.json();

      if (data.wall) {
        setWall(data.wall);
        await loadUserWalls(data.wall.id);
        return data.wall.id;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // ─── Update metadata (title, frameStyle) ──────────────────────────────────
  const updateWallMetadata = async (
    id: string,
    data: { title?: string; frameStyle?: WallFrameStyle }
  ) => {
    setWall((prev) => {
      if (prev.id !== id) return prev;
      return {
        ...prev,
        title: data.title !== undefined ? data.title.trim() : prev.title,
        frameStyle: data.frameStyle !== undefined ? data.frameStyle : prev.frameStyle,
      };
    });

    setWalls((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        return {
          ...w,
          title: data.title !== undefined ? data.title.trim() : w.title,
          frameStyle: data.frameStyle !== undefined ? data.frameStyle : w.frameStyle,
        };
      })
    );

    if (user) {
      try {
        await fetch("/api/walls", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallId: id, ...data }),
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // ─── Set frame style directly ─────────────────────────────────────────────
  const setFrameStyle = (style: WallFrameStyle) => {
    updateWallMetadata(wall.id, { frameStyle: style });
  };

  // ─── Delete wall ──────────────────────────────────────────────────────────
  const deleteWall = async (id: string): Promise<boolean> => {
    if (walls.length <= 1) return false;

    if (!user) {
      const remaining = walls.filter((w) => w.id !== id);
      setWalls(remaining);
      if (wall.id === id && remaining.length > 0) {
        const nextId = remaining[0].id;
        // create or load fallback
        setWall({
          id: nextId,
          title: remaining[0].title,
          columns: remaining[0].columns,
          rows: remaining[0].rows,
          frameStyle: remaining[0].frameStyle,
          slots: generateSlots(remaining[0].columns, remaining[0].rows),
        });
      }
      return true;
    }

    try {
      const res = await fetch(`/api/walls?wallId=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete wall");
      const data = await res.json();
      if (data.walls) {
        setWalls(data.walls);
        if (wall.id === id) {
          const next = data.walls[0];
          if (next) await loadUserWalls(next.id);
          else await loadUserWalls();
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // ─── Slot manipulation ────────────────────────────────────────────────────
  const setSlotCard = (slotId: string, card: Card) => {
    setWall((prev) => {
      const updatedSlots = prev.slots.map((slot) => {
        if (slot.slotId !== slotId) return slot;
        return {
          ...slot,
          cardId: card.id,
          cardData: card,
        };
      });
      return { ...prev, slots: updatedSlots };
    });
    setHasUnsavedChanges(true);
  };

  const clearSlot = (slotId: string) => {
    setWall((prev) => {
      const updatedSlots = prev.slots.map((slot) => {
        if (slot.slotId !== slotId) return slot;
        return {
          slotId: slot.slotId,
          position: slot.position,
        };
      });
      return { ...prev, slots: updatedSlots };
    });
    setHasUnsavedChanges(true);
  };

  const clearAllSlots = () => {
    setWall((prev) => {
      const updatedSlots = prev.slots.map((slot) => ({
        slotId: slot.slotId,
        position: slot.position,
      }));
      return { ...prev, slots: updatedSlots };
    });
    setHasUnsavedChanges(true);
  };

  const swapSlots = (sourceSlotId: string, targetSlotId: string) => {
    if (sourceSlotId === targetSlotId) return;
    setWall((prev) => {
      const sourceSlot = prev.slots.find((s) => s.slotId === sourceSlotId);
      const targetSlot = prev.slots.find((s) => s.slotId === targetSlotId);
      if (!sourceSlot || !targetSlot) return prev;

      const updatedSlots = prev.slots.map((slot) => {
        if (slot.slotId === sourceSlotId) {
          return {
            ...slot,
            cardId: targetSlot.cardId,
            cardData: targetSlot.cardData,
          };
        }
        if (slot.slotId === targetSlotId) {
          return {
            ...slot,
            cardId: sourceSlot.cardId,
            cardData: sourceSlot.cardData,
          };
        }
        return slot;
      });

      return { ...prev, slots: updatedSlots };
    });
    setHasUnsavedChanges(true);
  };

  return (
    <WallmakerContext.Provider
      value={{
        wall,
        walls,
        isLoaded,
        isSaving,
        hasUnsavedChanges,
        zoom,
        setZoom,
        switchWall,
        createWall,
        updateWallMetadata,
        deleteWall,
        setSlotCard,
        clearSlot,
        clearAllSlots,
        swapSlots,
        setFrameStyle,
        saveWallToServer,
      }}
    >
      {children}
    </WallmakerContext.Provider>
  );
}

export function useWallmaker() {
  const context = useContext(WallmakerContext);
  if (!context) {
    throw new Error("useWallmaker must be used within a WallmakerProvider");
  }
  return context;
}
