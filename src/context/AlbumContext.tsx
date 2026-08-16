"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Album,
  AlbumPage,
  AlbumSlot,
  AlbumSummary,
  Card,
  SlotState,
  WishlistUrl,
} from "@/types";
import { useSession } from "@/lib/auth-client";

interface AlbumContextType {
  album: Album;
  albums: AlbumSummary[];
  customCards: Card[];
  isLoaded: boolean;
  isPublic: boolean;
  activeAlbumId: string;
  // Album management
  switchAlbum: (albumId: string) => Promise<void>;
  createAlbum: (
    title: string,
    description?: string,
    isPublic?: boolean
  ) => Promise<string | null>;
  updateAlbumDetails: (
    albumId: string,
    data: {
      title?: string;
      description?: string;
      isPublic?: boolean;
      isDefault?: boolean;
    }
  ) => Promise<void>;
  deleteAlbum: (albumId: string) => Promise<boolean>;
  // Page management
  addPage: (atIndex?: number) => void;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, newName: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  // Slot management
  updateSlot: (
    pageId: string,
    slotId: string,
    card: Card,
    state: SlotState,
    language?: "JP" | "EN"
  ) => void;
  clearSlot: (pageId: string, slotId: string) => void;
  reorderSlots: (
    sourcePageId: string,
    sourceSlotId: string,
    targetPageId: string,
    targetSlotId: string
  ) => void;
  updateSlotWishlistUrls: (
    pageId: string,
    slotId: string,
    urls: WishlistUrl[]
  ) => void;
  // Custom cards
  addCustomCard: (card: Card) => void;
  deleteCustomCard: (cardId: string | number) => void;
  // Visibility
  togglePublic: () => void;
  // Manual Save
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  saveError: string | null;
  saveAlbumToServer: (targetAlbum?: Album) => Promise<void>;
  // Stats
  totalOwned: number;
  totalWishlist: number;
}

const AlbumContext = createContext<AlbumContextType | undefined>(undefined);

const SLOTS_PER_PAGE = 12;

const createEmptyPage = (index: number): AlbumPage => {
  const pageId = `page-${Date.now()}-${index}`;
  const slots: AlbumSlot[] = Array.from({ length: SLOTS_PER_PAGE }).map(
    (_, i) => ({
      slotId: `${pageId}-slot-${i}`,
      state: "EMPTY" as SlotState,
    })
  );
  return { pageId, title: `Page ${index + 1}`, slots };
};

const EMPTY_ALBUM: Album = {
  id: "local",
  title: "Mi Álbum",
  pages: [],
  isPublic: true,
  isDefault: true,
};

export function AlbumProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;

  const [album, setAlbum] = useState<Album>(EMPTY_ALBUM);
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);
  const [customCards, setCustomCards] = useState<Card[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const normalizeAlbumPages = (rawPages: AlbumPage[]): AlbumPage[] => {
    return rawPages.map((p: AlbumPage) => {
      const slots =
        p.slots.length >= SLOTS_PER_PAGE
          ? p.slots
          : [
              ...p.slots,
              ...Array.from({
                length: SLOTS_PER_PAGE - p.slots.length,
              }).map((_, i) => ({
                slotId: `${p.pageId}-slot-fill-${i}`,
                state: "EMPTY" as SlotState,
              })),
            ];
      return { ...p, slots };
    });
  };

  // ─── Load album when user logs in or mounts ──────────────────────────────
  const loadUserAlbums = useCallback(async (requestedAlbumId?: string) => {
    if (!user) {
      setAlbum({ ...EMPTY_ALBUM, pages: [createEmptyPage(0)] });
      setAlbums([
        {
          id: "local",
          title: "Mi Álbum",
          isPublic: true,
          isDefault: true,
          ownedCount: 0,
          wishlistCount: 0,
          totalSlots: SLOTS_PER_PAGE,
        },
      ]);
      setCustomCards([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    try {
      const url = requestedAlbumId
        ? `/api/album?albumId=${requestedAlbumId}`
        : "/api/album";
      const res = await fetch(url);
      const data = await res.json();

      if (data.album && data.album.pages) {
        const normalized: Album = {
          ...data.album,
          title: data.album.title || "Mi Álbum",
          pages: normalizeAlbumPages(data.album.pages),
        };
        setAlbum(normalized);
        setIsPublic(data.album.isPublic ?? true);
      } else {
        const defaultAlbum: Album = {
          id: "new",
          title: "Mi Álbum",
          pages: [createEmptyPage(0)],
          isPublic: true,
          isDefault: true,
        };
        setAlbum(defaultAlbum);
      }

      if (Array.isArray(data.albums)) {
        setAlbums(data.albums);
      }
    } catch (err) {
      console.error("Error fetching user albums:", err);
    } finally {
      setIsLoaded(true);
      setHasUnsavedChanges(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserAlbums();
  }, [loadUserAlbums]);

  // ─── Switch active album ──────────────────────────────────────────────────
  const switchAlbum = async (albumId: string) => {
    if (albumId === album.id) return;
    // If there are unsaved changes on current album, auto-save first
    if (hasUnsavedChanges && user) {
      try {
        await saveAlbumToServer();
      } catch (e) {
        console.error("Failed to auto-save before switching:", e);
      }
    }
    await loadUserAlbums(albumId);
  };

  // ─── Create a new album ───────────────────────────────────────────────────
  const createAlbum = async (
    title: string,
    description: string = "",
    isPublicOption: boolean = true
  ): Promise<string | null> => {
    if (!user) {
      // Local fallback for guest
      const newId = `local-${Date.now()}`;
      const newAlbum: Album = {
        id: newId,
        title: title || "Nuevo Álbum",
        description,
        pages: [createEmptyPage(0)],
        isPublic: isPublicOption,
        isDefault: false,
      };
      setAlbum(newAlbum);
      setAlbums((prev) => [
        ...prev,
        {
          id: newId,
          title: newAlbum.title,
          description,
          isPublic: isPublicOption,
          ownedCount: 0,
          wishlistCount: 0,
          totalSlots: SLOTS_PER_PAGE,
        },
      ]);
      return newId;
    }

    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isPublic: isPublicOption,
        }),
      });

      if (!res.ok) throw new Error("Error creating album");
      const data = await res.json();

      if (data.album) {
        const created: Album = {
          ...data.album,
          pages: normalizeAlbumPages(data.album.pages),
        };
        setAlbum(created);
        setIsPublic(created.isPublic ?? true);

        // Optimistically update list
        setAlbums((prev) => [
          {
            id: created.id,
            title: created.title,
            description: created.description,
            isPublic: created.isPublic ?? true,
            isDefault: created.isDefault ?? false,
            ownedCount: 0,
            wishlistCount: 0,
            totalSlots: SLOTS_PER_PAGE,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        // Refresh from server
        await loadUserAlbums(created.id);
        return created.id;
      }
    } catch (e) {
      console.error(e);
      setSaveError("No se pudo crear el nuevo álbum.");
    }
    return null;
  };

  // ─── Update album metadata (title, description, isPublic, etc.) ───────────
  const updateAlbumDetails = async (
    albumId: string,
    data: {
      title?: string;
      description?: string;
      isPublic?: boolean;
      isDefault?: boolean;
    }
  ) => {
    // Update active album if matching
    setAlbum((prev) => {
      if (prev.id === albumId) {
        return {
          ...prev,
          title: data.title !== undefined ? data.title : prev.title,
          description:
            data.description !== undefined ? data.description : prev.description,
          isPublic:
            data.isPublic !== undefined ? data.isPublic : prev.isPublic,
          isDefault:
            data.isDefault !== undefined ? data.isDefault : prev.isDefault,
        };
      }
      return prev;
    });

    // Update albums summary list
    setAlbums((prev) =>
      prev.map((a) => {
        if (a.id === albumId) {
          return {
            ...a,
            title: data.title !== undefined ? data.title : a.title,
            description:
              data.description !== undefined ? data.description : a.description,
            isPublic:
              data.isPublic !== undefined ? data.isPublic : a.isPublic,
            isDefault:
              data.isDefault !== undefined ? data.isDefault : a.isDefault,
          };
        }
        if (data.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      })
    );

    if (data.isPublic !== undefined && album.id === albumId) {
      setIsPublic(data.isPublic);
    }

    if (user) {
      try {
        await fetch("/api/album", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId, ...data }),
        });
      } catch (err) {
        console.error("Failed to update album details:", err);
      }
    }
  };

  // ─── Delete album ─────────────────────────────────────────────────────────
  const deleteAlbum = async (albumId: string): Promise<boolean> => {
    if (albums.length <= 1) return false;

    if (!user) {
      const remaining = albums.filter((a) => a.id !== albumId);
      setAlbums(remaining);
      if (album.id === albumId && remaining.length > 0) {
        setAlbum({
          id: remaining[0].id,
          title: remaining[0].title,
          pages: [createEmptyPage(0)],
          isPublic: remaining[0].isPublic,
        });
      }
      return true;
    }

    try {
      const res = await fetch(`/api/album?albumId=${albumId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete album");
      }

      const data = await res.json();
      if (data.albums) {
        setAlbums(data.albums);
      }

      // If we just deleted the active album, load another album
      if (album.id === albumId) {
        const nextAlbum = data.albums?.[0];
        if (nextAlbum) {
          await loadUserAlbums(nextAlbum.id);
        } else {
          await loadUserAlbums();
        }
      }
      return true;
    } catch (err) {
      console.error(err);
      setSaveError("No se pudo eliminar el álbum.");
      return false;
    }
  };

  // ─── Track Unsaved Changes & Manual / Auto Save ──────────────────────────
  const saveAlbumToServer = async (targetAlbum?: Album) => {
    if (!user) return;
    const albumToSave = targetAlbum || album;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ album: albumToSave }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (data.albumId && albumToSave.id !== data.albumId) {
        setAlbum((prev) => ({ ...prev, id: data.albumId }));
      }
      // Only clear unsaved flag on confirmed success
      setHasUnsavedChanges(false);

      // Refresh summaries to reflect latest card counts
      fetch("/api/album")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.albums)) setAlbums(d.albums);
        })
        .catch(console.error);
    } catch (e) {
      console.error(e);
      setSaveError("No se pudo guardar el álbum. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger hasUnsavedChanges whenever album changes (after initial load)
  const isLoadedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded) {
      isLoadedRef.current = false;
      return;
    }
    if (!isLoadedRef.current) {
      isLoadedRef.current = true;
      return;
    } // skip first render after load
    setHasUnsavedChanges(true);
  }, [album, isLoaded]);

  // ─── Page management ─────────────────────────────────────────────────────
  const addPage = (atIndex?: number) => {
    setAlbum((prev) => {
      const newPages = [...prev.pages];
      const newPage = createEmptyPage(prev.pages.length);
      if (atIndex !== undefined && atIndex >= 0 && atIndex <= newPages.length) {
        newPages.splice(atIndex, 0, newPage);
      } else {
        newPages.push(newPage);
      }
      return { ...prev, pages: newPages };
    });
  };

  const deletePage = (pageId: string) => {
    setAlbum((prev) => {
      const filtered = prev.pages.filter((p) => p.pageId !== pageId);
      if (filtered.length === 0) return prev;
      return { ...prev, pages: filtered };
    });
  };

  const renamePage = (pageId: string, newName: string) => {
    setAlbum((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.pageId === pageId ? { ...p, title: newName } : p
      ),
    }));
  };

  const reorderPages = (fromIndex: number, toIndex: number) => {
    setAlbum((prev) => {
      const newPages = [...prev.pages];
      const [moved] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, moved);
      return { ...prev, pages: newPages };
    });
  };

  // ─── Slot management ─────────────────────────────────────────────────────
  const updateSlot = (
    pageId: string,
    slotId: string,
    card: Card,
    state: SlotState,
    language?: "JP" | "EN"
  ) => {
    setAlbum((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        if (p.pageId !== pageId) return p;
        return {
          ...p,
          slots: p.slots.map((s) => {
            if (s.slotId !== slotId) return s;
            return { ...s, cardId: card.id, cardData: card, state, language };
          }),
        };
      }),
    }));
  };

  const clearSlot = (pageId: string, slotId: string) => {
    setAlbum((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.pageId === pageId
          ? {
              ...p,
              slots: p.slots.map((s) =>
                s.slotId === slotId
                  ? { slotId: s.slotId, state: "EMPTY" as SlotState }
                  : s
              ),
            }
          : p
      ),
    }));
  };

  const reorderSlots = (
    sourcePageId: string,
    sourceSlotId: string,
    targetPageId: string,
    targetSlotId: string
  ) => {
    if (sourceSlotId === targetSlotId && sourcePageId === targetPageId) return;
    setAlbum((prev) => {
      const sourcePage = prev.pages.find((p) => p.pageId === sourcePageId);
      const targetPage = prev.pages.find((p) => p.pageId === targetPageId);
      if (!sourcePage || !targetPage) return prev;
      const sourceSlot = sourcePage.slots.find(
        (s) => s.slotId === sourceSlotId
      );
      const targetSlot = targetPage.slots.find(
        (s) => s.slotId === targetSlotId
      );
      if (!sourceSlot || !targetSlot) return prev;
      return {
        ...prev,
        pages: prev.pages.map((p) => {
          if (p.pageId !== sourcePageId && p.pageId !== targetPageId) return p;
          return {
            ...p,
            slots: p.slots.map((s) => {
              if (p.pageId === sourcePageId && s.slotId === sourceSlotId) {
                return {
                  ...s,
                  cardId: targetSlot.cardId,
                  cardData: targetSlot.cardData,
                  state: targetSlot.state,
                  wishlistUrls: targetSlot.wishlistUrls,
                  language: targetSlot.language,
                };
              }
              if (p.pageId === targetPageId && s.slotId === targetSlotId) {
                return {
                  ...s,
                  cardId: sourceSlot.cardId,
                  cardData: sourceSlot.cardData,
                  state: sourceSlot.state,
                  wishlistUrls: sourceSlot.wishlistUrls,
                  language: sourceSlot.language,
                };
              }
              return s;
            }),
          };
        }),
      };
    });
  };

  const updateSlotWishlistUrls = (
    pageId: string,
    slotId: string,
    urls: WishlistUrl[]
  ) => {
    setAlbum((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        if (p.pageId !== pageId) return p;
        return {
          ...p,
          slots: p.slots.map((s) =>
            s.slotId === slotId ? { ...s, wishlistUrls: urls } : s
          ),
        };
      }),
    }));
  };

  // ─── Custom cards ─────────────────────────────────────────────────────────
  const addCustomCard = (card: Card) => {
    setCustomCards((prev) => [...prev, card]);
  };

  const deleteCustomCard = (cardId: string | number) => {
    setCustomCards((prev) => prev.filter((c) => c.id !== cardId));
    setAlbum((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => ({
        ...p,
        slots: p.slots.map((s) =>
          s.cardId === cardId
            ? { slotId: s.slotId, state: "EMPTY" as SlotState }
            : s
        ),
      })),
    }));
  };

  // ─── Toggle public/private for active album ────────────────────────────────
  const togglePublic = () => {
    const newValue = !isPublic;
    setIsPublic(newValue);
    updateAlbumDetails(album.id, { isPublic: newValue });
  };

  // ─── Stats for active album ───────────────────────────────────────────────
  const totalOwned = album.pages.reduce(
    (acc, p) => acc + p.slots.filter((s) => s.state === "OWNED").length,
    0
  );
  const totalWishlist = album.pages.reduce(
    (acc, p) => acc + p.slots.filter((s) => s.state === "WISHLIST").length,
    0
  );

  return (
    <AlbumContext.Provider
      value={{
        album,
        albums,
        customCards,
        isLoaded,
        isPublic,
        activeAlbumId: album.id,
        switchAlbum,
        createAlbum,
        updateAlbumDetails,
        deleteAlbum,
        addPage,
        deletePage,
        renamePage,
        reorderPages,
        updateSlot,
        clearSlot,
        reorderSlots,
        updateSlotWishlistUrls,
        addCustomCard,
        deleteCustomCard,
        togglePublic,
        hasUnsavedChanges,
        isSaving,
        saveError,
        saveAlbumToServer,
        totalOwned,
        totalWishlist,
      }}
    >
      {children}
    </AlbumContext.Provider>
  );
}

export function useAlbum() {
  const ctx = useContext(AlbumContext);
  if (!ctx) throw new Error("useAlbum must be used within AlbumProvider");
  return ctx;
}
