import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { Album, AlbumPage, AlbumSlot, AlbumSummary } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const requestedAlbumId = searchParams.get("albumId");

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

  // Find all public albums of this user
  const albumsRes = await db.query<{
    id: string;
    title: string;
    description: string | null;
    cover_url: string | null;
    is_public: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, title, description, cover_url, is_public, is_default, created_at, updated_at 
     FROM albums 
     WHERE user_id = $1 AND is_public = TRUE 
     ORDER BY is_default DESC, updated_at DESC`,
    [user.id]
  );

  const publicAlbums = albumsRes.rows;

  if (publicAlbums.length === 0) {
    return NextResponse.json({ error: "No public albums found" }, { status: 404 });
  }

  // Get slot counts for all public albums of this user
  const albumIds = publicAlbums.map((a) => a.id);
  const pagesSummaryRes = await db.query<{ id: string; album_id: string }>(
    `SELECT id, album_id FROM album_pages WHERE album_id = ANY($1)`,
    [albumIds]
  );
  const allPages = pagesSummaryRes.rows;

  const allPageDbIds = allPages.map((p) => p.id);
  const slotsSummaryRes = allPageDbIds.length
    ? await db.query<{ page_db_id: string; state: string }>(
        `SELECT page_db_id, state FROM album_slots WHERE page_db_id = ANY($1)`,
        [allPageDbIds]
      )
    : { rows: [] };
  const allSlots = slotsSummaryRes.rows;

  const albumSummaries: AlbumSummary[] = publicAlbums.map((a) => {
    const albumPageIds = allPages.filter((p) => p.album_id === a.id).map((p) => p.id);
    const albumSlots = allSlots.filter((s) => albumPageIds.includes(s.page_db_id));
    const ownedCount = albumSlots.filter((s) => s.state === "OWNED").length;
    const wishlistCount = albumSlots.filter((s) => s.state === "WISHLIST").length;

    return {
      id: a.id,
      title: a.title || "Mi Álbum",
      description: a.description ?? undefined,
      coverUrl: a.cover_url ?? undefined,
      isPublic: a.is_public,
      isDefault: a.is_default,
      ownedCount,
      wishlistCount,
      totalSlots: albumSlots.length,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  });

  // Pick target album
  let targetAlbumRow = requestedAlbumId
    ? publicAlbums.find((a) => a.id === requestedAlbumId)
    : publicAlbums[0];

  if (!targetAlbumRow) {
    targetAlbumRow = publicAlbums[0];
  }

  // Load pages and slots for the active target album
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
    [targetAlbumRow.id]
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

  const fullAlbum: Album = {
    id: targetAlbumRow.id,
    title: targetAlbumRow.title || "Mi Álbum",
    description: targetAlbumRow.description ?? undefined,
    coverUrl: targetAlbumRow.cover_url ?? undefined,
    pages: albumPages,
    isPublic: targetAlbumRow.is_public,
    isDefault: targetAlbumRow.is_default,
  };

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
    },
    albums: albumSummaries,
    album: fullAlbum,
  });
}
