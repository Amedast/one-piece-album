import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  // Get all public albums
  const albumsRes = await db.query<{
    id: string;
    is_public: boolean;
    updated_at: string;
    user_id: string;
  }>(`SELECT id, is_public, updated_at, user_id FROM albums WHERE is_public = TRUE ORDER BY updated_at DESC`);

  const publicAlbums = albumsRes.rows;

  if (publicAlbums.length === 0) {
    return NextResponse.json({ collectors: [] });
  }

  const userIds = publicAlbums.map((a) => a.user_id);

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

  const collectors = publicAlbums
    .map((album) => {
      const user = users.find((u) => u.id === album.user_id);
      if (!user || !user.username) return null;

      const albumPageIds = pages.filter((p) => p.album_id === album.id).map((p) => p.id);

      const ownedCount = slots.filter(
        (s) => albumPageIds.includes(s.page_db_id) && s.state === "OWNED"
      ).length;

      const wishlistCount = slots.filter(
        (s) => albumPageIds.includes(s.page_db_id) && s.state === "WISHLIST"
      ).length;

      return {
        userId: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        ownedCount,
        wishlistCount,
        updatedAt: album.updated_at,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ collectors });
}
