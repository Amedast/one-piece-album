import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import type { AlbumPage, AlbumSlot } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Find user by username
  const { data: user } = await supabase
    .from("user")
    .select("id, name, username, image")
    .eq("username", username)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Find their public album
  const { data: albumRow } = await supabase
    .from("albums")
    .select("id, is_public")
    .eq("user_id", user.id)
    .single();

  if (!albumRow || !albumRow.is_public) {
    return NextResponse.json({ error: "Album not found or private" }, { status: 404 });
  }

  const { data: pages } = await supabase
    .from("album_pages")
    .select("id, page_id, title, position")
    .eq("album_id", albumRow.id)
    .order("position", { ascending: true });

  const pageDbIds = (pages ?? []).map((p) => p.id);
  const { data: slots } = pageDbIds.length
    ? await supabase
        .from("album_slots")
        .select("*")
        .in("page_db_id", pageDbIds)
        .order("position", { ascending: true })
    : { data: [] };

  const albumPages: AlbumPage[] = (pages ?? []).map((p) => ({
    pageId: p.page_id,
    title: p.title,
    slots: (slots ?? [])
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
