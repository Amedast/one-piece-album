import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { WallPoster, WallPosterSummary, WallSlot, WallFrameStyle } from "@/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(val?: string | null): boolean {
  return typeof val === "string" && UUID_REGEX.test(val.trim());
}

let migrationRan = false;
async function ensureWallsTable() {
  if (migrationRan) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS walls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL DEFAULT 'Mi Cuadro',
        columns INTEGER NOT NULL DEFAULT 4,
        rows INTEGER NOT NULL DEFAULT 4,
        frame_style VARCHAR(50) NOT NULL DEFAULT 'obsidian',
        slots JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    migrationRan = true;
  } catch (e) {
    console.error("Migration error for walls table:", e);
  }
}

function createDefaultSlots(columns: number, rows: number): WallSlot[] {
  const total = columns * rows;
  return Array.from({ length: total }).map((_, i) => ({
    slotId: `wall-slot-${Date.now()}-${i}`,
    position: i,
  }));
}

// ─── GET /api/walls ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureWallsTable();
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const requestedWallId = searchParams.get("wallId");

  try {
    const listRes = await db.query<{
      id: string;
      title: string;
      columns: number;
      rows: number;
      frame_style: WallFrameStyle;
      slots: WallSlot[];
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, title, columns, rows, frame_style, slots, created_at, updated_at 
       FROM walls 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [userId]
    );

    let wallsRows = listRes.rows;

    // If user has no walls, create initial default 4x4 wall
    if (wallsRows.length === 0) {
      const initialSlots = createDefaultSlots(4, 4);
      const insertRes = await db.query<{
        id: string;
        title: string;
        columns: number;
        rows: number;
        frame_style: WallFrameStyle;
        slots: WallSlot[];
        created_at: string;
        updated_at: string;
      }>(
        `INSERT INTO walls (user_id, title, columns, rows, frame_style, slots, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, title, columns, rows, frame_style, slots, created_at, updated_at`,
        [userId, "Mi Cuadro #1", 4, 4, "obsidian", JSON.stringify(initialSlots)]
      );
      wallsRows = insertRes.rows;
    }

    const summaries: WallPosterSummary[] = wallsRows.map((w) => {
      const parsedSlots: WallSlot[] = Array.isArray(w.slots) ? w.slots : [];
      const filledCount = parsedSlots.filter((s) => s.cardId !== undefined).length;
      return {
        id: w.id,
        title: w.title,
        columns: w.columns,
        rows: w.rows,
        frameStyle: w.frame_style,
        totalSlots: w.columns * w.rows,
        filledCount,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      };
    });

    let targetRow = requestedWallId && isValidUUID(requestedWallId)
      ? wallsRows.find((w) => w.id === requestedWallId)
      : wallsRows[0];

    if (!targetRow) {
      targetRow = wallsRows[0];
    }

    const wall: WallPoster = {
      id: targetRow.id,
      title: targetRow.title,
      columns: targetRow.columns,
      rows: targetRow.rows,
      frameStyle: targetRow.frame_style,
      slots: Array.isArray(targetRow.slots) ? targetRow.slots : [],
      createdAt: targetRow.created_at,
      updatedAt: targetRow.updated_at,
    };

    return NextResponse.json({ wall, walls: summaries });
  } catch (err) {
    console.error("GET /api/walls error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/walls (Create or full save) ───────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureWallsTable();
  const userId = session.user.id;
  const body = await req.json();

  // Mode 1: Create new wall
  if (body.action === "create" || (body.columns && body.rows && !body.wall)) {
    const {
      title = "Nuevo Cuadro",
      columns = 4,
      rows = 4,
      frameStyle = "obsidian",
    }: {
      title?: string;
      columns?: number;
      rows?: number;
      frameStyle?: WallFrameStyle;
    } = body;

    const clampedCols = Math.min(Math.max(Number(columns) || 4, 2), 6);
    const clampedRows = Math.min(Math.max(Number(rows) || 4, 2), 6);
    const initialSlots = createDefaultSlots(clampedCols, clampedRows);

    try {
      const res = await db.query<{
        id: string;
        title: string;
        columns: number;
        rows: number;
        frame_style: WallFrameStyle;
        slots: WallSlot[];
        created_at: string;
        updated_at: string;
      }>(
        `INSERT INTO walls (user_id, title, columns, rows, frame_style, slots, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, title, columns, rows, frame_style, slots, created_at, updated_at`,
        [userId, title.trim() || "Nuevo Cuadro", clampedCols, clampedRows, frameStyle, JSON.stringify(initialSlots)]
      );

      const row = res.rows[0];
      const createdWall: WallPoster = {
        id: row.id,
        title: row.title,
        columns: row.columns,
        rows: row.rows,
        frameStyle: row.frame_style,
        slots: Array.isArray(row.slots) ? row.slots : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return NextResponse.json({ success: true, wall: createdWall });
    } catch (err) {
      console.error("POST /api/walls (create) error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  // Mode 2: Save existing or passed wall object
  const wall: WallPoster = body.wall;
  if (!wall) {
    return NextResponse.json({ error: "Wall data required" }, { status: 400 });
  }

  try {
    if (isValidUUID(wall.id)) {
      const updateRes = await db.query(
        `UPDATE walls 
         SET title = $1, frame_style = $2, slots = $3, updated_at = NOW() 
         WHERE id = $4 AND user_id = $5`,
        [wall.title, wall.frameStyle || "obsidian", JSON.stringify(wall.slots || []), wall.id, userId]
      );

      if ((updateRes.rowCount ?? 0) > 0) {
        return NextResponse.json({ success: true, wallId: wall.id });
      }
    }

    // Otherwise insert as new
    const clampedCols = Math.min(Math.max(Number(wall.columns) || 4, 2), 6);
    const clampedRows = Math.min(Math.max(Number(wall.rows) || 4, 2), 6);
    const insertRes = await db.query<{ id: string }>(
      `INSERT INTO walls (user_id, title, columns, rows, frame_style, slots, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [userId, wall.title || "Mi Cuadro", clampedCols, clampedRows, wall.frameStyle || "obsidian", JSON.stringify(wall.slots || [])]
    );

    return NextResponse.json({ success: true, wallId: insertRes.rows[0].id });
  } catch (err) {
    console.error("POST /api/walls (save) error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/walls (Update metadata) ──────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureWallsTable();
  const userId = session.user.id;
  const {
    wallId,
    title,
    frameStyle,
  }: {
    wallId?: string;
    title?: string;
    frameStyle?: WallFrameStyle;
  } = await req.json();

  if (!wallId || !isValidUUID(wallId)) {
    return NextResponse.json({ error: "Valid wallId required" }, { status: 400 });
  }

  const updates: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [wallId, userId];
  let index = 3;

  if (title !== undefined) {
    updates.push(`title = $${index++}`);
    values.push(title.trim());
  }
  if (frameStyle !== undefined) {
    updates.push(`frame_style = $${index++}`);
    values.push(frameStyle);
  }

  try {
    await db.query(
      `UPDATE walls SET ${updates.join(", ")} WHERE id = $1 AND user_id = $2`,
      values
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/walls error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/walls ───────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureWallsTable();
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const wallId = searchParams.get("wallId");

  if (!wallId || !isValidUUID(wallId)) {
    return NextResponse.json({ error: "Valid wallId required" }, { status: 400 });
  }

  try {
    // Check remaining count before deleting
    const countRes = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM walls WHERE user_id = $1`,
      [userId]
    );
    const count = parseInt(countRes.rows[0]?.count || "0", 10);
    if (count <= 1) {
      return NextResponse.json({ error: "No puedes eliminar tu único cuadro" }, { status: 400 });
    }

    await db.query(`DELETE FROM walls WHERE id = $1 AND user_id = $2`, [wallId, userId]);

    // Return updated summaries
    const listRes = await db.query<{
      id: string;
      title: string;
      columns: number;
      rows: number;
      frame_style: WallFrameStyle;
      slots: WallSlot[];
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, title, columns, rows, frame_style, slots, created_at, updated_at 
       FROM walls 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [userId]
    );

    const summaries: WallPosterSummary[] = listRes.rows.map((w) => ({
      id: w.id,
      title: w.title,
      columns: w.columns,
      rows: w.rows,
      frameStyle: w.frame_style,
      totalSlots: w.columns * w.rows,
      filledCount: Array.isArray(w.slots) ? w.slots.filter((s) => s.cardId !== undefined).length : 0,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }));

    return NextResponse.json({ success: true, walls: summaries });
  } catch (err) {
    console.error("DELETE /api/walls error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
