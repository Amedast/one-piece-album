import { GetCardsPayload, GetCardsResponse } from '@/types';

const API_URL = '/api/cards';

// Simple in-memory cache for SSR/Server, but mostly run on client where we can use sessionStorage
const memoryCache = new Map<string, GetCardsResponse>();

export async function fetchCards(payload: GetCardsPayload): Promise<GetCardsResponse> {
  const cacheKey = typeof window !== 'undefined' 
    ? `optcg_cache_${JSON.stringify(payload)}` 
    : JSON.stringify(payload);
  
  // 1. Check Memory Cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 2. Check Session Storage (only client side)
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryCache.set(cacheKey, parsed); // sync with memory
        return parsed;
      }
    } catch {
      // ignore parse errors or access errors
    }
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      showReprints: payload.showReprints ?? true,
      type: payload.type || ["LEADER", "EVENT", "CHARACTER", "STAGE"],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }

  const data = await response.json();
  
  // Save to Memory
  memoryCache.set(cacheKey, data);
  
  // Save to Session Storage
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      // quota exceeded, clear some or just ignore
    }
  }

  return data;
}
