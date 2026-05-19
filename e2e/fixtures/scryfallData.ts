// Minimal Scryfall-shaped fixtures for the E2E mock. Cards omit image URIs
// so the UI falls back to its placeholder rendering — fast, deterministic,
// and avoids any image requests during the test.

// Released date is in the past so the fetchSetList "released" filter keeps
// the set; pre-2024 keeps it stable across CI clocks.
export const sets = [
  {
    code: "tst",
    name: "Test Set",
    set_type: "expansion",
    released_at: "2024-01-01",
    icon_svg_uri: "",
  },
];

// Full card pool for the test set. fetchBoosterPack picks 15 per pack via
// rarity slots (1 rare/mythic, 3 uncommons, 11 commons), drawing without
// duplicates within a pack — so the pool needs enough of each rarity to
// satisfy that distribution.
const RARITIES: Array<{ rarity: "common" | "uncommon" | "rare" | "mythic"; count: number; prefix: string }> = [
  { rarity: "common", count: 30, prefix: "c" },
  { rarity: "uncommon", count: 12, prefix: "u" },
  { rarity: "rare", count: 6, prefix: "r" },
  { rarity: "mythic", count: 2, prefix: "m" },
];

export const setCards = RARITIES.flatMap(({ rarity, count, prefix }) =>
  Array.from({ length: count }, (_, i) => ({
    id: `tst-${prefix}${i.toString().padStart(2, "0")}`,
    name: `Test ${rarity} ${i + 1}`,
    type_line: "Creature — Test",
    rarity,
  }))
);

export const basics: Record<string, { id: string; name: string; type_line: string }> = {
  Plains: { id: "basic-plains", name: "Plains", type_line: "Basic Land — Plains" },
  Island: { id: "basic-island", name: "Island", type_line: "Basic Land — Island" },
  Swamp: { id: "basic-swamp", name: "Swamp", type_line: "Basic Land — Swamp" },
  Mountain: { id: "basic-mountain", name: "Mountain", type_line: "Basic Land — Mountain" },
  Forest: { id: "basic-forest", name: "Forest", type_line: "Basic Land — Forest" },
};
