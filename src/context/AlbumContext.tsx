'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Album, AlbumPage, AlbumSlot, Card, SlotState, WishlistUrl } from '@/types';

interface AlbumContextType {
  album: Album;
  customCards: Card[];
  isLoaded: boolean;
  // Page management
  addPage: (atIndex?: number) => void;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, newName: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  // Slot management
  updateSlot: (pageId: string, slotId: string, card: Card, state: SlotState, language?: 'JP' | 'EN') => void;
  clearSlot: (pageId: string, slotId: string) => void;
  reorderSlots: (sourcePageId: string, sourceSlotId: string, targetPageId: string, targetSlotId: string) => void;
  updateSlotWishlistUrls: (pageId: string, slotId: string, urls: WishlistUrl[]) => void;
  // Custom cards
  addCustomCard: (card: Card) => void;
  deleteCustomCard: (cardId: string | number) => void;
  // Stats
  totalOwned: number;
  totalWishlist: number;
}

const AlbumContext = createContext<AlbumContextType | undefined>(undefined);

const SLOTS_PER_PAGE = 12; // 4 cols × 3 rows

const createEmptyPage = (index: number): AlbumPage => {
  const pageId = `page-${Date.now()}-${index}`;
  const slots: AlbumSlot[] = Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => ({
    slotId: `${pageId}-slot-${i}`,
    state: 'EMPTY' as SlotState,
  }));
  return { pageId, title: `Page ${index + 1}`, slots };
};

export function AlbumProvider({ children }: { children: React.ReactNode }) {
  const [album, setAlbum] = useState<Album>({
    id: 'my-collection',
    pages: [createEmptyPage(0)],
  });
  const [customCards, setCustomCards] = useState<Card[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedAlbum = localStorage.getItem('op-digital-album');
      if (savedAlbum) setAlbum(JSON.parse(savedAlbum));

      const savedCustomCards = localStorage.getItem('op-custom-cards');
      if (savedCustomCards) setCustomCards(JSON.parse(savedCustomCards));
    } catch (err) {
      console.error('Failed to parse saved data', err);
    }
    setIsLoaded(true);
  }, []);

  // Persist album to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('op-digital-album', JSON.stringify(album));
    }
  }, [album, isLoaded]);

  // Persist custom cards to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('op-custom-cards', JSON.stringify(customCards));
    }
  }, [customCards, isLoaded]);

  // --- Page management ---
  const addPage = (atIndex?: number) => {
    setAlbum(prev => {
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
    setAlbum(prev => {
      const filtered = prev.pages.filter(p => p.pageId !== pageId);
      // Always keep at least 1 page
      if (filtered.length === 0) return prev;
      return { ...prev, pages: filtered };
    });
  };

  const renamePage = (pageId: string, newName: string) => {
    setAlbum(prev => ({
      ...prev,
      pages: prev.pages.map(p =>
        p.pageId === pageId ? { ...p, title: newName } : p
      ),
    }));
  };

  const reorderPages = (fromIndex: number, toIndex: number) => {
    setAlbum(prev => {
      const newPages = [...prev.pages];
      const [moved] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, moved);
      return { ...prev, pages: newPages };
    });
  };

  // --- Slot management ---
  const updateSlot = (pageId: string, slotId: string, card: Card, state: SlotState, language?: 'JP' | 'EN') => {
    setAlbum(prev => ({
      ...prev,
      pages: prev.pages.map(p => {
        if (p.pageId !== pageId) return p;
        return {
          ...p,
          slots: p.slots.map(s => {
            if (s.slotId !== slotId) return s;
            return { ...s, cardId: card.id, cardData: card, state, language };
          }),
        };
      }),
    }));
  };

  const clearSlot = (pageId: string, slotId: string) => {
    setAlbum(prev => ({
      ...prev,
      pages: prev.pages.map(p =>
        p.pageId === pageId
          ? {
              ...p,
              slots: p.slots.map(s =>
                s.slotId === slotId
                  ? { slotId: s.slotId, state: 'EMPTY' as SlotState }
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
    setAlbum(prev => {
      const sourcePage = prev.pages.find(p => p.pageId === sourcePageId);
      const targetPage = prev.pages.find(p => p.pageId === targetPageId);
      if (!sourcePage || !targetPage) return prev;

      const sourceSlot = sourcePage.slots.find(s => s.slotId === sourceSlotId);
      const targetSlot = targetPage.slots.find(s => s.slotId === targetSlotId);
      if (!sourceSlot || !targetSlot) return prev;

      return {
        ...prev,
        pages: prev.pages.map(p => {
          if (p.pageId !== sourcePageId && p.pageId !== targetPageId) return p;
          return {
            ...p,
            slots: p.slots.map(s => {
              if (p.pageId === sourcePageId && s.slotId === sourceSlotId) {
                return { ...s, cardId: targetSlot.cardId, cardData: targetSlot.cardData, state: targetSlot.state, wishlistUrls: targetSlot.wishlistUrls, language: targetSlot.language };
              }
              if (p.pageId === targetPageId && s.slotId === targetSlotId) {
                return { ...s, cardId: sourceSlot.cardId, cardData: sourceSlot.cardData, state: sourceSlot.state, wishlistUrls: sourceSlot.wishlistUrls, language: sourceSlot.language };
              }
              return s;
            }),
          };
        }),
      };
    });
  };

  const updateSlotWishlistUrls = (pageId: string, slotId: string, urls: WishlistUrl[]) => {
    setAlbum(prev => ({
      ...prev,
      pages: prev.pages.map(p => {
        if (p.pageId !== pageId) return p;
        return {
          ...p,
          slots: p.slots.map(s =>
            s.slotId === slotId ? { ...s, wishlistUrls: urls } : s
          ),
        };
      }),
    }));
  };

  // --- Custom cards ---
  const addCustomCard = (card: Card) => {
    setCustomCards(prev => [...prev, card]);
  };

  const deleteCustomCard = (cardId: string | number) => {
    setCustomCards(prev => prev.filter(c => c.id !== cardId));
    // Also clear from any album slots
    setAlbum(prev => ({
      ...prev,
      pages: prev.pages.map(p => ({
        ...p,
        slots: p.slots.map(s =>
          s.cardId === cardId ? { slotId: s.slotId, state: 'EMPTY' as SlotState } : s
        ),
      })),
    }));
  };

  // Stats
  const totalOwned = album.pages.reduce(
    (acc, p) => acc + p.slots.filter(s => s.state === 'OWNED').length,
    0
  );
  const totalWishlist = album.pages.reduce(
    (acc, p) => acc + p.slots.filter(s => s.state === 'WISHLIST').length,
    0
  );

  return (
    <AlbumContext.Provider
      value={{
        album,
        customCards,
        isLoaded,
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
  if (!ctx) throw new Error('useAlbum must be used within AlbumProvider');
  return ctx;
}
