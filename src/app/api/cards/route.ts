import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Card, GetCardsPayload } from "@/types";

const DATA_FILE = path.join(process.cwd(), "src/data/cards.json");

// Read cards once in memory (caching on route initialization for production)
let cachedCards: Card[] | null = null;

function getCards(): Card[] {
  if (cachedCards) return cachedCards;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, "utf-8");
      cachedCards = JSON.parse(fileContent);
      return cachedCards || [];
    }
  } catch (err) {
    console.error("Failed to read local cards data:", err);
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body: GetCardsPayload = await request.json();
    const cards = getCards();

    // 1. Filter
    let filtered = cards;

    // A. Filter by set (card_set is an array of set labels or IDs, e.g. ["556001"])
    if (body.card_set && body.card_set.length > 0) {
      filtered = filtered.filter(
        (card) => card.card_sets && body.card_set!.includes(card.card_sets)
      );
    }

    // B. Filter by name (case-insensitive partial match in name, ID, or serial)
    if (body.name && body.name.trim() !== "") {
      const search = body.name.toLowerCase().trim();
      filtered = filtered.filter(
        (card) =>
          (card.name && card.name.toLowerCase().includes(search)) ||
          (card.id && String(card.id).toLowerCase().includes(search)) ||
          (card.serial && card.serial.toLowerCase().includes(search))
      );
    }

    // C. Filter by type (category / card type)
    if (body.type && body.type.length > 0) {
      // e.g. ["LEADER", "EVENT", "CHARACTER", "STAGE"]
      filtered = filtered.filter(
        (card) => card.type && body.type!.includes(card.type.toUpperCase())
      );
    }

    // D. Filter by rarity (short code)
    if (body.rarity && body.rarity.length > 0) {
      // e.g. ["SR", "SEC"]
      filtered = filtered.filter(
        (card) => card.rarity && body.rarity!.includes(card.rarity)
      );
    }

    // E. Filter by color (e.g. Red, Blue, Multi-Color)
    if (body.color && body.color.length > 0) {
      filtered = filtered.filter((card) => {
        if (!card.color) return false;

        // Multi-Color check: if card has dual color like "Red/Green"
        const cardColors = card.color.split("/");

        return body.color!.some((filterColor) => {
          if (filterColor === "Multi-Color") {
            return cardColors.length > 1;
          }
          return cardColors.includes(filterColor);
        });
      });
    }

    // F. Filter by reprints (showReprints = false to hide duplicates)
    if (body.showReprints === false) {
      filtered = filtered.filter((card) => !card.reprint);
    }

    // G. Filter by alternate arts (showAltArts: 'only' | 'hide' | 'show')
    if (body.showAltArts === "only") {
      filtered = filtered.filter(
        (card) => card.id && String(card.id).includes("_p")
      );
    } else if (body.showAltArts === "hide") {
      filtered = filtered.filter(
        (card) => card.id && !String(card.id).includes("_p")
      );
    }

    // 2. Paginate (page is 0-indexed, page size is 20)
    const PAGE_SIZE = 20;
    const page = body.page || 0;
    const count = filtered.length;
    const startIndex = page * PAGE_SIZE;
    const paginatedData = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    return NextResponse.json({
      data: paginatedData,
      count: count,
    });
  } catch (error) {
    console.error("Filtering error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
