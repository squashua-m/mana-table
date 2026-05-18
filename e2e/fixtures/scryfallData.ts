// Minimal Scryfall-shaped fixtures for the E2E mock. Cards omit image URIs
// so the UI falls back to its placeholder rendering — fast, deterministic,
// and avoids any image requests during the test.

export const sets = [
  {
    code: "tst",
    name: "Test Set",
    set_type: "expansion",
    released_at: "2099-01-01",
    icon_svg_uri: "",
  },
];

export const booster = [
  { id: "tst-001", name: "Test Card 01", type_line: "Creature — Test" },
  { id: "tst-002", name: "Test Card 02", type_line: "Creature — Test" },
  { id: "tst-003", name: "Test Card 03", type_line: "Creature — Test" },
  { id: "tst-004", name: "Test Card 04", type_line: "Creature — Test" },
  { id: "tst-005", name: "Test Card 05", type_line: "Creature — Test" },
  { id: "tst-006", name: "Test Card 06", type_line: "Creature — Test" },
  { id: "tst-007", name: "Test Card 07", type_line: "Instant" },
  { id: "tst-008", name: "Test Card 08", type_line: "Sorcery" },
  { id: "tst-009", name: "Test Card 09", type_line: "Enchantment" },
  { id: "tst-010", name: "Test Card 10", type_line: "Artifact" },
  { id: "tst-011", name: "Test Card 11", type_line: "Creature — Test" },
  { id: "tst-012", name: "Test Card 12", type_line: "Instant" },
  { id: "tst-013", name: "Test Card 13", type_line: "Sorcery" },
  { id: "tst-014", name: "Test Card 14", type_line: "Creature — Test" },
  { id: "tst-015", name: "Test Card 15", type_line: "Land" },
];

export const basics: Record<string, { id: string; name: string; type_line: string }> = {
  Plains: { id: "basic-plains", name: "Plains", type_line: "Basic Land — Plains" },
  Island: { id: "basic-island", name: "Island", type_line: "Basic Land — Island" },
  Swamp: { id: "basic-swamp", name: "Swamp", type_line: "Basic Land — Swamp" },
  Mountain: { id: "basic-mountain", name: "Mountain", type_line: "Basic Land — Mountain" },
  Forest: { id: "basic-forest", name: "Forest", type_line: "Basic Land — Forest" },
};
