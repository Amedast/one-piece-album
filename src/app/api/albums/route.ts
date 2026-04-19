import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  // Get all users with public albums
  const { data: publicAlbums } = await supabase
    .from("albums")
    .select(`
      id,
      is_public,
      updated_at,
      user_id
    `)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  if (!publicAlbums || publicAlbums.length === 0) {
    return NextResponse.json({ collectors: [] });
  }

  const userIds = publicAlbums.map((a) => a.user_id);

  const { data: users } = await supabase
    .from("user")
    .select("id, name, username, image")
    .in("id", userIds);

  // Get slot counts (owned cards) per album
  const albumIds = publicAlbums.map((a) => a.id);
  const { data: pages } = await supabase
    .from("album_pages")
    .select("id, album_id")
    .in("album_id", albumIds);

  const pageDbIds = (pages ?? []).map((p) => p.id);
  const { data: slots } = pageDbIds.length
    ? await supabase
        .from("album_slots")
        .select("page_db_id, state")
        .in("page_db_id", pageDbIds)
    : { data: [] };

  const collectors = publicAlbums
    .map((album) => {
      const user = users?.find((u) => u.id === album.user_id);
      if (!user || !user.username) return null;

      const albumPageIds = (pages ?? [])
        .filter((p) => p.album_id === album.id)
        .map((p) => p.id);

      const ownedCount = (slots ?? []).filter(
        (s) => albumPageIds.includes(s.page_db_id) && s.state === "OWNED"
      ).length;

      const wishlistCount = (slots ?? []).filter(
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
