import { GetCardsPayload, GetCardsResponse } from '@/types';

const API_URL = '/api/cards';

export async function fetchCards(payload: GetCardsPayload): Promise<GetCardsResponse> {
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
  return data;
}
