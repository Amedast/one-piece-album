import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Album, AlbumPage, AlbumSlot, AlbumSummary, AlbumSize } from "@/types";

function getSlotsCount(size?: AlbumSize): number {
  if (size === "3x3") return 9;
  if (size === "4x4") return 16;
  return 12;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(val?: string | null): boolean {
  return typeof val === "string" && UUID_REGEX.test(val.trim());
}

let migrationRan = false;
async function ensureSizeColumn() {
  if (migrationRan) return;
  try {
    await db.query(`ALTER TABLE albums ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT '4x3';`);
    migrationRan = true;
  } catch (e) {
    console.error("Migration error for size column:", e);
  }
}

function createEmptyPage(index: number, size: AlbumSize = "4x3"): AlbumPage {
  const pageId = `page-${Date.now()}-${index}`;
  const count = getSlotsCount(size);
  const slots: AlbumSlot[] = Array.from({ length: count }).map(
    (_, i) => ({
      slotId: `${pageId}-slot-${i}`,
      state: "EMPTY",
    })
  );
  return { pageId, title: `Page ${index + 1}`, slots };
}

// ─── Helper: Get summaries of all albums for a user ─────────────────────────
async function fetchUserAlbumsSummaries(userId: string): Promise<AlbumSummary[]> {
  await ensureSizeColumn();
  const albumsRes = await db.query<{
    id: string;
    title: string;
    description: string | null;
    size: AlbumSize | null;
    cover_url: string | null;
    is_public: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, title, description, size, cover_url, is_public, is_default, created_at, updated_at 
     FROM albums 
     WHERE user_id = $1 
     ORDER BY is_default DESC, updated_at DESC`,
    [userId]
  );

  const albumRows = albumsRes.rows;
  if (albumRows.length === 0) return [];

  const albumIds = albumRows.map((a) => a.id);

  const pagesRes = await db.query<{ id: string; album_id: string }>(
    `SELECT id, album_id FROM album_pages WHERE album_id = ANY($1)`,
    [albumIds]
  );
  const pages = pagesRes.rows;

  const pageDbIds = pages.map((p) => p.id);
  const slotsRes = pageDbIds.length
    ? await db.query<{ page_db_id: string; state: string }>(
        `SELECT page_db_id, state FROM album_slots WHERE page_db_id = ANY($1)`,
        [pageDbIds]
      )
    : { rows: [] };
  const slots = slotsRes.rows;

  return albumRows.map((album) => {
    const albumPageIds = pages
      .filter((p) => p.album_id === album.id)
      .map((p) => p.id);

    const albumSlots = slots.filter((s) => albumPageIds.includes(s.page_db_id));
    const ownedCount = albumSlots.filter((s) => s.state === "OWNED").length;
    const wishlistCount = albumSlots.filter((s) => s.state === "WISHLIST").length;
    const totalSlots = albumSlots.length;

    return {
      id: album.id,
      title: album.title || "Mi Álbum",
      description: album.description ?? undefined,
      size: (album.size as AlbumSize) || "4x3",
      coverUrl: album.cover_url ?? undefined,
      isPublic: album.is_public,
      isDefault: album.is_default,
      ownedCount,
      wishlistCount,
      totalSlots,
      createdAt: album.created_at,
      updatedAt: album.updated_at,
    };
  });
}

// ─── Helper: Get a full album by ID or default for user ─────────────────────
async function fetchAlbumFromDB(
  userId: string,
  albumId?: string | null
): Promise<Album | null> {
  await ensureSizeColumn();
  let albumRow: {
    id: string;
    title: string;
    description: string | null;
    size: AlbumSize | null;
    cover_url: string | null;
    is_public: boolean;
    is_default: boolean;
  } | null = null;

  if (isValidUUID(albumId)) {
    const albumRes = await db.query<{
      id: string;
      title: string;
      description: string | null;
      size: AlbumSize | null;
      cover_url: string | null;
      is_public: boolean;
      is_default: boolean;
    }>(
      `SELECT id, title, description, size, cover_url, is_public, is_default 
       FROM albums 
       WHERE id = $1 AND user_id = $2 
       LIMIT 1`,
      [albumId, userId]
    );
    albumRow = albumRes.rows[0] ?? null;
  }

  // Fallback to default or most recent
  if (!albumRow) {
    const albumRes = await db.query<{
      id: string;
      title: string;
      description: string | null;
      size: AlbumSize | null;
      cover_url: string | null;
      is_public: boolean;
      is_default: boolean;
    }>(
      `SELECT id, title, description, size, cover_url, is_public, is_default 
       FROM albums 
       WHERE user_id = $1 
       ORDER BY is_default DESC, updated_at DESC 
       LIMIT 1`,
      [userId]
    );
    albumRow = albumRes.rows[0] ?? null;
  }

  if (!albumRow) return null;

  const albumSize: AlbumSize = (albumRow.size as AlbumSize) || "4x3";

  const pagesRes = await db.query<{
    id: string;
    page_id: string;
    title: string;
    position: number;
  }>(
    `SELECT id, page_id, title, position 
     FROM album_pages 
     WHERE album_id = $1 
     ORDER BY position ASC`,
    [albumRow.id]
  );
  const pages = pagesRes.rows;

  if (pages.length === 0) {
    return {
      id: albumRow.id,
      title: albumRow.title || "Mi Álbum",
      description: albumRow.description ?? undefined,
      size: albumSize,
      coverUrl: albumRow.cover_url ?? undefined,
      pages: [],
      isPublic: albumRow.is_public,
      isDefault: albumRow.is_default,
    };
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

  return {
    id: albumRow.id,
    title: albumRow.title || "Mi Álbum",
    description: albumRow.description ?? undefined,
    size: albumSize,
    coverUrl: albumRow.cover_url ?? undefined,
    pages: albumPages,
    isPublic: albumRow.is_public,
    isDefault: albumRow.is_default,
  };
}

// ─── GET /api/album ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedAlbumId = searchParams.get("albumId");

  const userId = session.user.id;
  let albums = await fetchUserAlbumsSummaries(userId);
  let album = await fetchAlbumFromDB(userId, requestedAlbumId);

  // If user has no albums at all, create a first default album
  if (!album && albums.length === 0) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const newAlbumRes = await client.query<{ id: string }>(
        `INSERT INTO albums (user_id, title, size, is_public, is_default, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [userId, "Mi Álbum", "4x3", true, true]
      );
      const newAlbumId = newAlbumRes.rows[0].id;
      const initialPage = createEmptyPage(0, "4x3");

      const pageRes = await client.query<{ id: string }>(
        `INSERT INTO album_pages (album_id, page_id, title, position) VALUES ($1, $2, $3, $4) RETURNING id`,
        [newAlbumId, initialPage.pageId, initialPage.title, 0]
      );
      const pageDbId = pageRes.rows[0].id;

      const values: unknown[] = [];
      const placeholders = initialPage.slots.map((slot, si) => {
        const base = si * 8;
        values.push(pageDbId, slot.slotId, si, slot.state, null, null, null, null);
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
      });

      await client.query(
        `INSERT INTO album_slots (page_db_id, slot_id, position, state, card_id, card_data, language, wishlist_urls)
         VALUES ${placeholders.join(",")}`,
        values
      );

      await client.query("COMMIT");

      album = {
        id: newAlbumId,
        title: "Mi Álbum",
        size: "4x3",
        pages: [initialPage],
        isPublic: true,
        isDefault: true,
      };
      albums = [
        {
          id: newAlbumId,
          title: "Mi Álbum",
          size: "4x3",
          isPublic: true,
          isDefault: true,
          ownedCount: 0,
          wishlistCount: 0,
          totalSlots: 12,
        },
      ];
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("Error creating initial album:", e);
    } finally {
      client.release();
    }
  }

  return NextResponse.json({ album, albums });
}

// ─── POST /api/album  (save/update full album structure) ─────────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSizeColumn();
  const { album }: { album: Album } = await req.json();
  const userId = session.user.id;
  const albumSize: AlbumSize = album.size || "4x3";
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let albumDbId: string | null = null;

    if (isValidUUID(album.id)) {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM albums WHERE id = $1 AND user_id = $2`,
        [album.id, userId]
      );
      if (existing.rows.length > 0) {
        albumDbId = existing.rows[0].id;
        await client.query(
          `UPDATE albums 
           SET title = $1, description = $2, is_public = $3, cover_url = $4, size = $5, updated_at = NOW() 
           WHERE id = $6 AND user_id = $7`,
          [
            album.title || "Mi Álbum",
            album.description ?? "",
            album.isPublic ?? true,
            album.coverUrl ?? null,
            albumSize,
            albumDbId,
            userId,
          ]
        );
      }
    }

    if (!albumDbId) {
      // Create new album record
      const albumRes = await client.query<{ id: string }>(
        `INSERT INTO albums (user_id, title, description, size, cover_url, is_public, is_default, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
          userId,
          album.title || "Mi Álbum",
          album.description ?? "",
          albumSize,
          album.coverUrl ?? null,
          album.isPublic ?? true,
          album.isDefault ?? false,
        ]
      );
      albumDbId = albumRes.rows[0].id;
    }

    // Delete existing pages (cascade deletes slots)
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
    return NextResponse.json({ success: true, albumId: albumDbId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /api/album error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

// ─── PATCH /api/album  (update metadata) ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSizeColumn();
  const {
    albumId,
    title,
    description,
    isPublic,
    isDefault,
    coverUrl,
  }: {
    albumId?: string;
    title?: string;
    description?: string;
    isPublic?: boolean;
    isDefault?: boolean;
    coverUrl?: string;
  } = await req.json();

  const userId = session.user.id;

  if (!albumId || !isValidUUID(albumId)) {
    return NextResponse.json({ error: "Valid albumId is required" }, { status: 400 });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    if (isDefault) {
      // Clear default on all other albums
      await client.query(`UPDATE albums SET is_default = FALSE WHERE user_id = $1`, [
        userId,
      ]);
    }

    const updates: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [albumId, userId];
    let index = 3;

    if (title !== undefined) {
      updates.push(`title = $${index++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${index++}`);
      values.push(description);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${index++}`);
      values.push(isPublic);
    }
    if (isDefault !== undefined) {
      updates.push(`is_default = $${index++}`);
      values.push(isDefault);
    }
    if (coverUrl !== undefined) {
      updates.push(`cover_url = $${index++}`);
      values.push(coverUrl);
    }

    await client.query(
      `UPDATE albums SET ${updates.join(", ")} WHERE id = $1 AND user_id = $2`,
      values
    );

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("PATCH /api/album error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

// ─── DELETE /api/album ──────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let albumId = searchParams.get("albumId");

  if (!albumId) {
    try {
      const body = await req.json();
      albumId = body.albumId;
    } catch {
      // body parse error or empty
    }
  }

  if (!albumId || !isValidUUID(albumId)) {
    return NextResponse.json({ error: "Valid albumId is required" }, { status: 400 });
  }

  const userId = session.user.id;

  // Count user's albums: user cannot delete their last remaining album
  const countRes = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM albums WHERE user_id = $1`,
    [userId]
  );
  if (parseInt(countRes.rows[0]?.count || "0", 10) <= 1) {
    return NextResponse.json(
      { error: "No puedes eliminar tu único álbum." },
      { status: 400 }
    );
  }

  // Delete the album
  await db.query(`DELETE FROM albums WHERE id = $1 AND user_id = $2`, [
    albumId,
    userId,
  ]);

  // If deleted album was default, set another album as default
  const remaining = await fetchUserAlbumsSummaries(userId);
  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    await db.query(
      `UPDATE albums SET is_default = TRUE WHERE id = $1 AND user_id = $2`,
      [remaining[0].id, userId]
    );
    remaining[0].isDefault = true;
  }

  return NextResponse.json({ success: true, albums: remaining });
}
