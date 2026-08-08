import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { AlbumPage, AlbumSlot } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Find user by username
  const userRes = await db.query<{
    id: string;
    name: string;
    username: string;
    image: string | null;
  }>(
    `SELECT id, name, username, image FROM "user" WHERE username = $1 LIMIT 1`,
    [username]
  );
  const user = userRes.rows[0];

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Find their public album
  const albumRes = await db.query<{ id: string; is_public: boolean }>(
    `SELECT id, is_public FROM albums WHERE user_id = $1 LIMIT 1`,
    [user.id]
  );
  const albumRow = albumRes.rows[0];

  if (!albumRow || !albumRow.is_public) {
    return NextResponse.json({ error: "Album not found or private" }, { status: 404 });
  }

  const pagesRes = await db.query<{
    id: string;
    page_id: string;
    title: string;
    position: number;
  }>(
    `SELECT id, page_id, title, position FROM album_pages WHERE album_id = $1 ORDER BY position ASC`,
    [albumRow.id]
  );
  const pages = pagesRes.rows;

  const pageDbIds = pages.map((p) => p.id);
  const slotsRes = pageDbIds.length
    ? await db.query(
        `SELECT * FROM album_slots WHERE page_db_id = ANY($1) ORDER BY position ASC`,
        [pageDbIds]
      )
    : { rows: [] };
  const slots = slotsRes.rows;

  const albumPages: AlbumPage[] = pages.map((p) => ({
    pageId: p.page_id,
    title: p.title,
    slots: slots
      .filter((s) => s.page_db_id === p.id)
      .map((s) => ({
        slotId: s.slot_id,
        state: s.state,
        cardId: s.card_id ?? undefined,
        cardData: s.card_data ?? undefined,
        language: s.language ?? undefined,
        wishlistUrls: s.wishlist_urls ?? undefined,
      })) as AlbumSlot[],
  }));

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
    },
    album: {
      id: albumRow.id,
      pages: albumPages,
      isPublic: albumRow.is_public,
    },
  });
}
