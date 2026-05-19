import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  _resetScryfallStateForTests,
  buildPackFromCards,
  fetchBoosterPack,
  fetchSetList,
  type ScryfallCard,
} from "./scryfall";

function makeCard(id: string, rarity: ScryfallCard["rarity"], typeLine = "Creature — Test"): ScryfallCard {
  return { id, name: `Card ${id}`, rarity, type_line: typeLine };
}

function makeCards(count: number, rarity: ScryfallCard["rarity"], prefix = "c"): ScryfallCard[] {
  return Array.from({ length: count }, (_, i) => makeCard(`${prefix}-${i}`, rarity));
}

function mockJsonResponse(data: unknown, init?: { ok?: boolean; status?: number }): Response {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => data,
  } as unknown as Response;
}

beforeEach(() => {
  _resetScryfallStateForTests();
  vi.restoreAllMocks();
});

describe("fetchSetList", () => {
  it("filters to released draftable sets, maps fields, and sorts newest first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockJsonResponse({
          data: [
            // Announced but unreleased — cards aren't searchable yet so
            // picking this set would produce empty packs.
            { code: "fra", name: "Reality Fracture", set_type: "expansion", released_at: "2099-10-02", icon_svg_uri: "fr.svg" },
            { code: "fdn", name: "Foundations", set_type: "core", released_at: "2024-11-15", icon_svg_uri: "f.svg" },
            { code: "tdsk", name: "Duskmourn Tokens", set_type: "token", released_at: "2024-10-01", icon_svg_uri: "t.svg" },
            { code: "blb", name: "Bloomburrow", set_type: "expansion", released_at: "2024-08-02", icon_svg_uri: "b.svg" },
            { code: "mh3", name: "Modern Horizons 3", set_type: "draft_innovation", released_at: "2024-06-14", icon_svg_uri: "m.svg" },
          ],
        })
      )
    );

    const sets = await fetchSetList();

    expect(sets.map((s) => s.code)).toEqual(["fdn", "blb", "mh3"]); // unreleased fra + token-only tdsk excluded
    expect(sets[0]).toEqual({
      code: "fdn",
      name: "Foundations",
      releasedAt: "2024-11-15",
      iconSvgUri: "f.svg",
    });
  });

  it("caches the result and does not re-fetch on subsequent calls", async () => {
    const fetchMock = vi.fn(async () => mockJsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchSetList();
    const second = await fetchSetList();
    const third = await fetchSetList();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockJsonResponse(null, { ok: false, status: 503 })));

    await expect(fetchSetList()).rejects.toThrow(/503/);
  });
});

describe("fetchBoosterPack", () => {
  it("builds a 15-card pack from /cards/search results", async () => {
    const setCards = [
      ...makeCards(50, "common"),
      ...makeCards(20, "uncommon"),
      ...makeCards(10, "rare"),
      ...makeCards(3, "mythic"),
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockJsonResponse({ data: setCards, has_more: false }))
    );

    const pack = await fetchBoosterPack("fdn");

    expect(pack).toHaveLength(15);
    const allowedIds = new Set(setCards.map((c) => c.id));
    for (const c of pack) {
      expect(allowedIds.has(c.id)).toBe(true);
    }
  });

  it("follows pagination via has_more / next_page", async () => {
    const page1 = makeCards(175, "common", "p1");
    const page2 = makeCards(50, "uncommon", "p2");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        mockJsonResponse({ data: page1, has_more: true, next_page: "https://api.scryfall.com/page2" })
      )
      .mockResolvedValueOnce(mockJsonResponse({ data: page2, has_more: false }));
    vi.stubGlobal("fetch", fetchMock);

    const pack = await fetchBoosterPack("big");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(pack).toHaveLength(15);
  });

  it("throws when the search returns no cards", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockJsonResponse({ data: [], has_more: false }))
    );

    await expect(fetchBoosterPack("empty")).rejects.toThrow(/no cards/);
  });

  it("honors the 75ms throttle between sequential calls (even when issued concurrently)", async () => {
    const callTimes: number[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        callTimes.push(Date.now());
        return mockJsonResponse({ data: makeCards(20, "common"), has_more: false });
      })
    );

    await Promise.all([
      fetchBoosterPack("a"),
      fetchBoosterPack("b"),
      fetchBoosterPack("c"),
    ]);

    expect(callTimes).toHaveLength(3);
    expect(callTimes[1] - callTimes[0]).toBeGreaterThanOrEqual(75);
    expect(callTimes[2] - callTimes[1]).toBeGreaterThanOrEqual(75);
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockJsonResponse(null, { ok: false, status: 404 })));

    await expect(fetchBoosterPack("nope")).rejects.toThrow(/404/);
  });

  it("propagates errors from malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError("Unexpected token in JSON at position 0");
          },
        }) as unknown as Response
      )
    );

    await expect(fetchBoosterPack("bad")).rejects.toThrow(SyntaxError);
  });
});

describe("buildPackFromCards", () => {
  it("includes exactly one rare or mythic in the rare slot", () => {
    const cards = [
      ...makeCards(20, "common"),
      ...makeCards(10, "uncommon"),
      ...makeCards(5, "rare"),
      ...makeCards(3, "mythic"),
    ];

    // Run repeatedly to smooth over randomness — every pack should have
    // exactly one card from {rare, mythic}.
    for (let i = 0; i < 20; i++) {
      const pack = buildPackFromCards(cards);
      const rareSlot = pack.filter((c) => c.rarity === "rare" || c.rarity === "mythic");
      expect(rareSlot).toHaveLength(1);
    }
  });

  it("excludes basic lands from the pack pool", () => {
    const cards = [
      { id: "forest", name: "Forest", type_line: "Basic Land — Forest", rarity: "common" as const },
      ...makeCards(40, "common"),
    ];
    const pack = buildPackFromCards(cards);
    expect(pack.some((c) => c.name === "Forest")).toBe(false);
  });

  it("returns no duplicate card ids within a pack", () => {
    const cards = [
      ...makeCards(30, "common"),
      ...makeCards(10, "uncommon"),
      ...makeCards(5, "rare"),
    ];
    const pack = buildPackFromCards(cards);
    const ids = pack.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
