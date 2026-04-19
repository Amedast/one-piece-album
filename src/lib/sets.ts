import { SetData } from "@/types";

const SETS_CACHE_KEY = "one_piece_sets_data";
const GITHUB_URL =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main/english-asia/packs.json";

/**
 * Main function to get the sets
 */
export async function loadSets(): Promise<SetData[]> {
  // 1. Try to get fresh data from GitHub
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second limit

    const response = await fetch(GITHUB_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Server response error");

    const rawSets = await response.json();

    // Convert object to array and sort by label (e.g., OP-01, ST-01)
    const setsArray: SetData[] = Object.values(rawSets);

    // 2. Save in device for future occasions
    await saveToDevice(setsArray);

    console.log("Sets updated from GitHub");
    return setsArray;
  } catch (error) {
    console.warn("Fetch failed, attempting to recover local backup...", error);

    const localSets = await getFromDevice();

    if (localSets) {
      return localSets;
    } else {
      console.error("No local data available.");
      return [];
    }
  }
}

/**
 * Persistence in the device
 */
async function saveToDevice(data: SetData[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETS_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving to localStorage", e);
  }
}

/**
 * Recovery from persistence
 */
async function getFromDevice(): Promise<SetData[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SETS_CACHE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
