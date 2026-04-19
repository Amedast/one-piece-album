import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Album, AlbumPage, AlbumSlot } from "@/types";

// ─── Helper: get the full album from DB ─────────────────────────────────────
async function fetchAlbumFromDB(userId: string): Promise<Album | null> {
  const { data: albumRow } = await supabase
    .from("albums")
    .select("id, is_public")
    .eq("user_id", userId)
    .single();

  if (!albumRow) return null;

  const { data: pages } = await supabase
    .from("album_pages")
    .select("id, page_id, title, position")
    .eq("album_id", albumRow.id)
    .order("position", { ascending: true });

  if (!pages || pages.length === 0) {
    return { id: albumRow.id, pages: [], isPublic: albumRow.is_public };
  }

  const pageDbIds = pages.map((p) => p.id);
  const { data: slots } = await supabase
    .from("album_slots")
    .select("*")
    .in("page_db_id", pageDbIds)
    .order("position", { ascending: true });

  const albumPages: AlbumPage[] = pages.map((p) => ({
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

  // Upsert album row
  const { data: albumRow, error: albumErr } = await supabase
    .from("albums")
    .upsert(
      { user_id: userId, is_public: album.isPublic ?? true, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (albumErr || !albumRow) {
    return NextResponse.json({ error: albumErr?.message }, { status: 500 });
  }

  const albumDbId = albumRow.id;

  // Delete all existing pages (cascade deletes slots)
  await supabase.from("album_pages").delete().eq("album_id", albumDbId);

  // Insert pages and slots
  for (let pi = 0; pi < album.pages.length; pi++) {
    const page = album.pages[pi];

    const { data: pageRow } = await supabase
      .from("album_pages")
      .insert({
        album_id: albumDbId,
        page_id: page.pageId,
        title: page.title,
        position: pi,
      })
      .select("id")
      .single();

    if (!pageRow) continue;

    const slotsToInsert = page.slots.map((slot, si) => ({
      page_db_id: pageRow.id,
      slot_id: slot.slotId,
      position: si,
      state: slot.state,
      card_id: slot.cardId?.toString() ?? null,
      card_data: slot.cardData ?? null,
      language: slot.language ?? null,
      wishlist_urls: slot.wishlistUrls ?? null,
    }));

    if (slotsToInsert.length > 0) {
      await supabase.from("album_slots").insert(slotsToInsert);
    }
  }

  return NextResponse.json({ success: true });
}

// ─── PATCH /api/album  (toggle visibility) ───────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isPublic }: { isPublic: boolean } = await req.json();

  await supabase
    .from("albums")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("user_id", session.user.id);

  return NextResponse.json({ success: true });
}
