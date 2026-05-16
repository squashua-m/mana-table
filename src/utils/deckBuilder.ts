import type { ScryfallCard } from "./scryfall";

export type CardCategory = "land" | "creature" | "spell";

export type BasicName = "Plains" | "Island" | "Swamp" | "Mountain" | "Forest";

export const BASIC_NAMES: readonly BasicName[] = [
  "Plains",
  "Island",
  "Swamp",
  "Mountain",
  "Forest",
];

// Fixed limited-deck targets — see PRD.
export const TARGETS = {
  lands: 17,
  creatures: 15,
  spells: 8,
  totalMain: 40,
} as const;

// Extracts the front face's type_line. Scryfall serializes DFC parents as
// "Front // Back"; we deck-build off the front face.
function frontTypeLine(card: ScryfallCard): string {
  const raw = card.type_line ?? card.card_faces?.[0]?.type_line ?? "";
  const idx = raw.indexOf("//");
  return idx === -1 ? raw : raw.slice(0, idx).trim();
}

// Categorize per PRD: "Land" wins over "Creature" wins over else (spell).
// Artifact-creatures count as creatures; planeswalkers count as spells;
// MDFC like Lair-of-the-Hydra (Land // Creature) counts as land.
export function categorize(
  card: ScryfallCard
): CardCategory {
  const line = frontTypeLine(card);
  if (line.includes("Land")) return "land";
  if (line.includes("Creature")) return "creature";
  return "spell";
}

export type DeckProgress = {
  lands: { current: number; target: number };
  creatures: { current: number; target: number };
  spells: { current: number; target: number };
  totalMain: { current: number; target: number };
};

// Aggregates the main pool + basic-land count against the limited targets.
// `mainIndices` are positions into `pool` that the player allocated to main.
// `basicsCount` is the sum of all 5 basic-land steppers.
export function computeProgress(
  pool: readonly ScryfallCard[],
  mainIndices: ReadonlySet<number>,
  basicsCount: number
): DeckProgress {
  let lands = basicsCount;
  let creatures = 0;
  let spells = 0;
  for (const idx of mainIndices) {
    const card = pool[idx];
    if (!card) continue;
    const cat = categorize(card);
    if (cat === "land") lands++;
    else if (cat === "creature") creatures++;
    else spells++;
  }
  return {
    lands: { current: lands, target: TARGETS.lands },
    creatures: { current: creatures, target: TARGETS.creatures },
    spells: { current: spells, target: TARGETS.spells },
    totalMain: {
      current: mainIndices.size + basicsCount,
      target: TARGETS.totalMain,
    },
  };
}

export type DeckAllocation = {
  mainIndices: number[];
  basics: Record<BasicName, number>;
};

export function emptyBasics(): Record<BasicName, number> {
  return { Plains: 0, Island: 0, Swamp: 0, Mountain: 0, Forest: 0 };
}

const STORAGE_KEY_PREFIX = "mana-table-deck-";

export function deckStorageKey(connectionId: number): string {
  return `${STORAGE_KEY_PREFIX}${connectionId}`;
}

// Forgiving parse — old/corrupt entries return null so the caller can fall
// back to the default "all sideboard" state.
export function parseStoredAllocation(raw: string | null): DeckAllocation | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const mainIndices = Array.isArray(parsed.mainIndices)
      ? parsed.mainIndices.filter((n: unknown): n is number => typeof n === "number")
      : [];
    const basics = emptyBasics();
    if (parsed.basics && typeof parsed.basics === "object") {
      for (const name of BASIC_NAMES) {
        const v = (parsed.basics as Record<string, unknown>)[name];
        if (typeof v === "number" && v >= 0 && Number.isFinite(v)) {
          basics[name] = Math.floor(v);
        }
      }
    }
    return { mainIndices, basics };
  } catch {
    return null;
  }
}
