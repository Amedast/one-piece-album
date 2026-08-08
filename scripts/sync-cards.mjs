import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_URL = "https://github.com/buhbbl/punk-records.git";
const TEMP_DIR = path.join(__dirname, "../temp_sync");
const DATA_DIR = path.join(__dirname, "../src/data");

// Map full rarity names to internal short codes
const RARITY_MAP = {
  Leader: "L",
  Common: "C",
  Uncommon: "UC",
  Rare: "R",
  SuperRare: "SR",
  SecretRare: "SEC",
  Special: "SP CARD",
  Promo: "P",
};

// Map category names to uppercase
const CATEGORY_MAP = {
  Leader: "LEADER",
  Character: "CHARACTER",
  Event: "EVENT",
  Stage: "STAGE",
};

async function sync() {
  console.log("Starting sync from punk-records...");

  // Clean temp dir if it exists
  if (fs.existsSync(TEMP_DIR)) {
    console.log("Cleaning existing temp directory...");
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  // Clone repo shallowly
  console.log(`Cloning ${REPO_URL} into ${TEMP_DIR}...`);
  execSync(`git clone --depth 1 ${REPO_URL} "${TEMP_DIR}"`, { stdio: "inherit" });

  // Ensure src/data exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Copy packs.json
  const sourcePacksPath = path.join(TEMP_DIR, "english-asia/packs.json");
  const targetPacksPath = path.join(DATA_DIR, "packs.json");
  if (fs.existsSync(sourcePacksPath)) {
    console.log("Saving packs.json...");
    fs.copyFileSync(sourcePacksPath, targetPacksPath);
  } else {
    throw new Error("packs.json not found in cloned repo at " + sourcePacksPath);
  }

  // Read all card JSON files in english-asia/data/*.json
  const packsDataDir = path.join(TEMP_DIR, "english-asia/data");
  if (!fs.existsSync(packsDataDir)) {
    throw new Error("Data directory not found at " + packsDataDir);
  }

  const files = fs.readdirSync(packsDataDir).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} pack JSON files to process.`);

  const allCards = [];

  for (const file of files) {
    const filePath = path.join(packsDataDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const cardsArray = JSON.parse(content);

    for (const card of cardsArray) {
      // Map properties to our Card interface
      const mappedRarity = RARITY_MAP[card.rarity] || card.rarity || "C";
      const mappedType =
        CATEGORY_MAP[card.category] ||
        card.category?.toUpperCase() ||
        "CHARACTER";

      // Dual colors joining, e.g. ["Red", "Green"] -> "Red/Green"
      const mappedColor = Array.isArray(card.colors)
        ? card.colors.join("/")
        : card.colors || "Red";

      // Types joining, e.g. ["Supernovas", "Straw Hat Crew"] -> "Supernovas / Straw Hat Crew"
      const mappedFeature = Array.isArray(card.types)
        ? card.types.join(" / ")
        : card.types || null;

      // Attribute mapping, e.g. ["Slash"] -> "Slash"
      const mappedAttribute = Array.isArray(card.attributes)
        ? card.attributes[0] || null
        : card.attributes || null;

      // Parse serial (base card ID) - remove suffix like _p1, _r1
      const mappedSerial = card.id ? card.id.split("_")[0] : "";

      // Determine reprint
      const isReprint = card.id ? card.id.includes("_r") : false;

      const mappedCard = {
        id: card.id,
        name: card.name,
        serial: mappedSerial,
        rarity: mappedRarity,
        type: mappedType,
        cost: typeof card.cost === "number" ? card.cost : null,
        power: typeof card.power === "number" ? card.power : null,
        counter: typeof card.counter === "number" ? card.counter : null,
        color: mappedColor,
        feature: mappedFeature,
        effect: card.effect === "-" ? null : card.effect || null,
        trigger: card.trigger || null,
        url: card.img_full_url || card.img_url || "",
        reprint: isReprint,
        card_sets: card.pack_id || null,
        isCustom: false,
      };

      allCards.push(mappedCard);
    }
  }

  // Sort cards by id to make output stable
  allCards.sort((a, b) => a.id.localeCompare(b.id));

  // Write allCards to src/data/cards.json
  const targetCardsPath = path.join(DATA_DIR, "cards.json");
  console.log(
    `Saving ${allCards.length} compiled cards to ${targetCardsPath}...`
  );
  fs.writeFileSync(
    targetCardsPath,
    JSON.stringify(allCards, null, 2),
    "utf-8"
  );

  // Cleanup temp dir
  console.log("Cleaning up temp directory...");
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log("Sync completed successfully!");
}

sync().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
