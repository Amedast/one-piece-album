export interface Card {
  id: number | string; // supports custom card string IDs
  img_id?: string;
  series_id?: string;
  name: string;
  serial: string;
  rarity: string;
  type: string;
  cost?: number | null;
  attribute?: string | null;
  power?: number | null;
  counter?: string | null;
  color: string;
  feature?: string | null;
  effect?: string | null;
  card_sets?: string | null;
  trigger?: string | null;
  remarks?: string | null;
  reprint?: boolean;
  url: string;
  imageData?: string; // base64 for custom cards
  isCustom?: boolean;
}

export interface GetCardsResponse {
  data: Card[];
  count: number;
}

export interface SetData {
  id: string;
  raw_title: string;
  title_parts: {
    prefix: string | null;
    title: string;
    label: string | null;
  };
}

export interface GetCardsPayload {
  page: number;
  name?: string;
  showReprints?: boolean;
  type?: string[];
  rarity?: string[];
  color?: string[];
  card_set?: string[];
  showAltArts?: 'only' | 'hide' | 'show';
}

export type SlotState = 'EMPTY' | 'OWNED' | 'WISHLIST';

export interface WishlistUrl {
  url: string;
  price?: string;   // optional price label, e.g. "2.50€"
  notes?: string;   // optional comment
}

export interface AlbumSlot {
  slotId: string;
  cardId?: number | string;
  cardData?: Card;
  state: SlotState;
  wishlistUrls?: WishlistUrl[]; // optional buy links for wishlist cards
  language?: 'JP' | 'EN';
}

export interface AlbumPage {
  pageId: string;
  title: string;
  slots: AlbumSlot[]; // 12 slots: 4 columns × 3 rows
}

export interface Album {
  id: string;
  pages: AlbumPage[];
  isPublic?: boolean;
}
