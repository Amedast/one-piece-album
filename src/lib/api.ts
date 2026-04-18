import { GetCardsPayload, GetCardsResponse } from '@/types';

const API_URL = '/api/cards';

// Simple in-memory cache
const cache = new Map<string, GetCardsResponse>();

export async function fetchCards(payload: GetCardsPayload): Promise<GetCardsResponse> {
  const cacheKey = JSON.stringify(payload);
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
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
  cache.set(cacheKey, data);
  return data;
}
