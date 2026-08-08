import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Album, AlbumPage, AlbumSlot } from "@/types";

// ─── Helper: get the full album from DB ─────────────────────────────────────
async function fetchAlbumFromDB(userId: string): Promise<Album | null> {
  const albumRes = await db.query<{ id: string; is_public: boolean }>(
    `SELECT id, is_public FROM albums WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  const albumRow = albumRes.rows[0];
  if (!albumRow) return null;

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

  if (pages.length === 0) {
    return { id: albumRow.id, pages: [], isPublic: albumRow.is_public };
  }

  const pageDbIds = pages.map((p) => p.id);
  const slotsRes = await db.query(
    `SELECT * FROM album_slots WHERE page_db_id = ANY($1) ORDER BY position ASC`,
    [pageDbIds]
  );
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

  return { id: albumRow.id, pages: albumPages, isPublic: albumRow.is_public };
}

// ─── GET /api/album ──────────────────────────────────────────────────────────
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const album = await fetchAlbumFromDB(session.user.id);
  return NextResponse.json({ album });
}

// ─── POST /api/album  (full save / upsert) ───────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { album }: { album: Album } = await req.json();
  const userId = session.user.id;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Upsert album row
    const albumRes = await client.query<{ id: string }>(
      `INSERT INTO albums (user_id, is_public, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET is_public = EXCLUDED.is_public, updated_at = NOW()
       RETURNING id`,
      [userId, album.isPublic ?? true]
    );
    const albumDbId = albumRes.rows[0].id;

    // Delete all existing pages (cascade deletes slots)
    await client.query(`DELETE FROM album_pages WHERE album_id = $1`, [albumDbId]);

    // Insert pages and slots
    for (let pi = 0; pi < album.pages.length; pi++) {
      const page = album.pages[pi];

      const pageRes = await client.query<{ id: string }>(
        `INSERT INTO album_pages (album_id, page_id, title, position) VALUES ($1, $2, $3, $4) RETURNING id`,
        [albumDbId, page.pageId, page.title, pi]
      );
      const pageDbId = pageRes.rows[0].id;

      if (page.slots.length > 0) {
        const values: unknown[] = [];
        const placeholders = page.slots.map((slot, si) => {
          const base = si * 8;
          values.push(
            pageDbId,
            slot.slotId,
            si,
            slot.state,
            slot.cardId?.toString() ?? null,
            slot.cardData ? JSON.stringify(slot.cardData) : null,
            slot.language ?? null,
            slot.wishlistUrls ? JSON.stringify(slot.wishlistUrls) : null
          );
          return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
        });

        await client.query(
          `INSERT INTO album_slots (page_db_id, slot_id, position, state, card_id, card_data, language, wishlist_urls)
           VALUES ${placeholders.join(",")}`,
          values
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /api/album error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

// ─── PATCH /api/album  (toggle visibility) ───────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isPublic }: { isPublic: boolean } = await req.json();

  await db.query(
    `UPDATE albums SET is_public = $1, updated_at = NOW() WHERE user_id = $2`,
    [isPublic, session.user.id]
  );

  return NextResponse.json({ success: true });
}
