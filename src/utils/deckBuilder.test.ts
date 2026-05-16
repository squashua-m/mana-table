import { describe, expect, it } from "vitest";
import {
  BASIC_NAMES,
  TARGETS,
  categorize,
  computeProgress,
  emptyBasics,
  parseStoredAllocation,
} from "./deckBuilder";
import type { ScryfallCard } from "./scryfall";

function card(typeLine: string, faces?: Array<{ type_line?: string }>): ScryfallCard {
  return {
    id: `id-${typeLine}-${Math.random().toString(36).slice(2, 8)}`,
    name: typeLine,
    type_line: typeLine,
    card_faces: faces?.map((f, i) => ({
      name: `face-${i}`,
      type_line: f.type_line,
    })),
  };
}

function dfcCard(parent: string, faces: Array<{ type_line: string }>): ScryfallCard {
  return {
    id: `dfc-${parent}-${Math.random().toString(36).slice(2, 8)}`,
    name: parent,
    type_line: parent,
    card_faces: faces.map((f, i) => ({
      name: `face-${i}`,
      type_line: f.type_line,
    })),
  };
}

describe("categorize", () => {
  it("maps basic Land type lines to 'land'", () => {
    expect(categorize(card("Basic Land — Forest"))).toBe("land");
    expect(categorize(card("Land"))).toBe("land");
  });

  it("maps Creature type lines to 'creature'", () => {
    expect(categorize(card("Creature — Elf Druid"))).toBe("creature");
  });

  it("treats artifact-creatures as creatures (Creature present, no Land)", () => {
    expect(categorize(card("Artifact Creature — Construct"))).toBe("creature");
  });

  it("categorizes planeswalkers as spells (no Land, no Creature)", () => {
    expect(categorize(card("Legendary Planeswalker — Chandra"))).toBe("spell");
  });

  it("categorizes instants and sorceries as spells", () => {
    expect(categorize(card("Instant"))).toBe("spell");
    expect(categorize(card("Sorcery"))).toBe("spell");
    expect(categorize(card("Artifact"))).toBe("spell");
    expect(categorize(card("Enchantment"))).toBe("spell");
  });

  it("gives Land precedence over Creature when both appear (e.g. 'Land Creature — Treefolk')", () => {
    expect(categorize(card("Land Creature — Forest Treefolk"))).toBe("land");
  });

  it("uses the front face of a transform DFC ('Land — Forest // Creature — Bear')", () => {
    expect(
      categorize(
        dfcCard("Land — Forest // Creature — Bear", [
          { type_line: "Land — Forest" },
          { type_line: "Creature — Bear" },
        ])
      )
    ).toBe("land");
  });

  it("uses the front face of an MDFC ('Land — Forest // Creature — Hydra') — categorizes as land", () => {
    expect(
      categorize(
        dfcCard("Land — Forest // Creature — Hydra", [
          { type_line: "Land — Forest" },
          { type_line: "Creature — Hydra" },
        ])
      )
    ).toBe("land");
  });

  it("uses the front face when DFC front is a non-creature spell", () => {
    expect(
      categorize(
        dfcCard("Sorcery // Creature — Avatar", [
          { type_line: "Sorcery" },
          { type_line: "Creature — Avatar" },
        ])
      )
    ).toBe("spell");
  });

  it("falls back to card_faces[0].type_line when parent type_line is missing", () => {
    expect(
      categorize({
        id: "x",
        name: "Werewolf",
        card_faces: [
          { name: "front", type_line: "Creature — Werewolf" },
          { name: "back", type_line: "Creature — Wolf" },
        ],
      })
    ).toBe("creature");
  });

  it("returns 'spell' when type_line is missing entirely", () => {
    expect(categorize({ id: "x", name: "Mystery" })).toBe("spell");
  });
});

describe("computeProgress", () => {
  it("returns all zeroes for an empty pool, empty main, and no basics", () => {
    const progress = computeProgress([], new Set(), 0);
    expect(progress).toEqual({
      lands: { current: 0, target: TARGETS.lands },
      creatures: { current: 0, target: TARGETS.creatures },
      spells: { current: 0, target: TARGETS.spells },
      totalMain: { current: 0, target: TARGETS.totalMain },
    });
  });

  it("counts basics as lands and into total main", () => {
    const progress = computeProgress([], new Set(), 17);
    expect(progress.lands.current).toBe(17);
    expect(progress.totalMain.current).toBe(17);
  });

  it("sums main-board cards by category and adds basics to lands + total", () => {
    const pool: ScryfallCard[] = [
      card("Creature — Elf"),
      card("Creature — Goblin"),
      card("Instant"),
      card("Sorcery"),
      card("Basic Land — Forest"), // a non-basic in pool counts as land
    ];
    const main = new Set([0, 1, 2, 3, 4]);
    const progress = computeProgress(pool, main, 12);

    expect(progress.lands.current).toBe(13); // 12 basics + 1 land from pool
    expect(progress.creatures.current).toBe(2);
    expect(progress.spells.current).toBe(2);
    expect(progress.totalMain.current).toBe(17); // 5 picks + 12 basics
  });

  it("ignores out-of-range mainIndices defensively", () => {
    const pool: ScryfallCard[] = [card("Instant")];
    const main = new Set([0, 99]);
    const progress = computeProgress(pool, main, 0);
    expect(progress.spells.current).toBe(1);
    expect(progress.totalMain.current).toBe(2);
  });
});

describe("parseStoredAllocation", () => {
  it("returns null for null/empty/invalid JSON", () => {
    expect(parseStoredAllocation(null)).toBeNull();
    expect(parseStoredAllocation("")).toBeNull();
    expect(parseStoredAllocation("not json")).toBeNull();
  });

  it("returns null for non-object payloads", () => {
    expect(parseStoredAllocation("123")).toBeNull();
    expect(parseStoredAllocation("\"string\"")).toBeNull();
  });

  it("parses a valid payload and floors fractional basic counts", () => {
    const stored = JSON.stringify({
      mainIndices: [0, 1, 7],
      basics: { Plains: 4, Island: 0, Swamp: 2.7, Mountain: -3, Forest: 6 },
    });
    const parsed = parseStoredAllocation(stored);
    expect(parsed).not.toBeNull();
    expect(parsed!.mainIndices).toEqual([0, 1, 7]);
    expect(parsed!.basics.Plains).toBe(4);
    expect(parsed!.basics.Swamp).toBe(2); // floored
    expect(parsed!.basics.Mountain).toBe(0); // negative dropped to default
    expect(parsed!.basics.Forest).toBe(6);
  });

  it("ignores unexpected mainIndices entries", () => {
    const stored = JSON.stringify({
      mainIndices: [0, "not a number", 2, null, 3],
    });
    expect(parseStoredAllocation(stored)?.mainIndices).toEqual([0, 2, 3]);
  });
});

describe("misc", () => {
  it("BASIC_NAMES has all 5 basics in WUBRG order", () => {
    expect(BASIC_NAMES).toEqual(["Plains", "Island", "Swamp", "Mountain", "Forest"]);
  });

  it("emptyBasics initializes every basic to 0", () => {
    expect(emptyBasics()).toEqual({ Plains: 0, Island: 0, Swamp: 0, Mountain: 0, Forest: 0 });
  });
});
