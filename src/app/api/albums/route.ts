import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Album, AlbumPage, AlbumSlot, AlbumSize } from "@/types";

function getSlotsCount(size?: AlbumSize): number {
  if (size === "3x3") return 9;
  if (size === "4x4") return 16;
  return 12;
}

let migrationRan = false;
async function ensureSizeColumn() {
  if (migrationRan) return;
  try {
    await db.query(`ALTER TABLE albums ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT '4x3';`);
    migrationRan = true;
  } catch (e) {
    console.error("Migration error for size column in albums route:", e);
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

// ─── GET /api/albums (Explore public albums) ─────────────────────────────────
export async function GET() {
  await ensureSizeColumn();
  const albumsRes = await db.query<{
    id: string;
    title: string;
    description: string | null;
    size: AlbumSize | null;
    cover_url: string | null;
    is_public: boolean;
    updated_at: string;
    user_id: string;
  }>(
    `SELECT id, title, description, size, cover_url, is_public, updated_at, user_id 
     FROM albums 
     WHERE is_public = TRUE 
     ORDER BY updated_at DESC`
  );

  const publicAlbums = albumsRes.rows;

  if (publicAlbums.length === 0) {
    return NextResponse.json({ albums: [], collectors: [] });
  }

  const userIds = Array.from(new Set(publicAlbums.map((a) => a.user_id)));

  const usersRes = await db.query<{
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  }>(
    `SELECT id, name, username, image FROM "user" WHERE id = ANY($1)`,
    [userIds]
  );
  const users = usersRes.rows;

  // Get slot counts per album
  const albumIds = publicAlbums.map((a) => a.id);

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

  const publicAlbumItems = publicAlbums
    .map((album) => {
      const user = users.find((u) => u.id === album.user_id);
      if (!user || !user.username) return null;

      const albumPageIds = pages
        .filter((p) => p.album_id === album.id)
        .map((p) => p.id);

      const ownedCount = slots.filter(
        (s) => albumPageIds.includes(s.page_db_id) && s.state === "OWNED"
      ).length;

      const wishlistCount = slots.filter(
        (s) => albumPageIds.includes(s.page_db_id) && s.state === "WISHLIST"
      ).length;

      return {
        albumId: album.id,
        title: album.title || "Mi Álbum",
        description: album.description ?? "",
        size: (album.size as AlbumSize) || "4x3",
        coverUrl: album.cover_url ?? null,
        userId: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        ownedCount,
        wishlistCount,
        totalPages: albumPageIds.length,
        updatedAt: album.updated_at,
      };
    })
    .filter(Boolean);

  // Backward compatibility: also export collectors format if needed
  return NextResponse.json({
    albums: publicAlbumItems,
    collectors: publicAlbumItems,
  });
}

// ─── POST /api/albums (Create new album for logged-in user) ──────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSizeColumn();
  const {
    title,
    description = "",
    size = "4x3",
    isPublic = true,
  }: {
    title?: string;
    description?: string;
    size?: AlbumSize;
    isPublic?: boolean;
  } = await req.json();

  const albumTitle = title?.trim() || "Nuevo Álbum";
  const albumSize: AlbumSize = size || "4x3";
  const userId = session.user.id;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Insert new album
    const newAlbumRes = await client.query<{ id: string }>(
      `INSERT INTO albums (user_id, title, description, size, is_public, is_default, updated_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
       RETURNING id`,
      [userId, albumTitle, description, albumSize, isPublic]
    );
    const newAlbumId = newAlbumRes.rows[0].id;

    // Create 1 initial empty page with matching size
    const initialPage = createEmptyPage(0, albumSize);
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

    const createdAlbum: Album = {
      id: newAlbumId,
      title: albumTitle,
      description,
      size: albumSize,
      pages: [initialPage],
      isPublic,
      isDefault: false,
    };

    return NextResponse.json({ success: true, album: createdAlbum });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /api/albums error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

