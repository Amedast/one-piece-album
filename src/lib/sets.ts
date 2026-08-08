import { SetData } from "@/types";
import packsData from "@/data/packs.json";

/**
 * Main function to get the sets loaded locally
 */
export async function loadSets(): Promise<SetData[]> {
  try {
    // Convert object to array
    const setsArray: SetData[] = Object.values(packsData);

    // Sort: OP > EB > PRB > Others
    setsArray.sort((a, b) => {
      const getPriority = (label: string | null | undefined) => {
        if (!label) return 999;
        if (label.startsWith("OP-")) return 1;
        if (label.startsWith("EB-")) return 2;
        if (label.startsWith("PRB-")) return 3;
        return 4;
      };

      const pA = getPriority(a.title_parts.label);
      const pB = getPriority(b.title_parts.label);

      if (pA !== pB) return pA - pB;

      // If same priority, sort alphabetically/numerically by label
      return (a.title_parts.label || "").localeCompare(
        b.title_parts.label || ""
      );
    });

    return setsArray;
  } catch (error) {
    console.error("Error loading sets:", error);
    return [];
  }
}
