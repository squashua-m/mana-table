import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  _resetScryfallStateForTests,
  fetchBoosterPack,
  fetchSetList,
} from "./scryfall";

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
  it("filters to draftable set types, maps fields, and sorts newest first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockJsonResponse({
          data: [
            { code: "fdn", name: "Foundations", set_type: "core", released_at: "2024-11-15", icon_svg_uri: "f.svg" },
            { code: "tdsk", name: "Duskmourn Tokens", set_type: "token", released_at: "2024-10-01", icon_svg_uri: "t.svg" },
            { code: "blb", name: "Bloomburrow", set_type: "expansion", released_at: "2024-08-02", icon_svg_uri: "b.svg" },
            { code: "mh3", name: "Modern Horizons 3", set_type: "draft_innovation", released_at: "2024-06-14", icon_svg_uri: "m.svg" },
          ],
        })
      )
    );

    const sets = await fetchSetList();

    expect(sets.map((s) => s.code)).toEqual(["fdn", "blb", "mh3"]); // newest first, token excluded
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
  it("returns the cards array from the booster endpoint", async () => {
    const cards = [{ id: "1", name: "Llanowar Elves" }, { id: "2", name: "Forest" }];
    vi.stubGlobal("fetch", vi.fn(async () => mockJsonResponse({ data: cards })));

    const pack = await fetchBoosterPack("fdn");

    expect(pack).toEqual(cards);
  });

  it("honors the 75ms throttle between sequential calls (even when issued concurrently)", async () => {
    const callTimes: number[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        callTimes.push(Date.now());
        return mockJsonResponse({ data: [] });
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
