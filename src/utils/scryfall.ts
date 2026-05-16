// Scryfall asks for 50–100 ms between requests. We use 75 to match the
// per-card pacing in useSpawnDeck.ts.
const RATE_LIMIT_MS = 75;

const DRAFTABLE_SET_TYPES = new Set([
  "expansion",
  "core",
  "masters",
  "draft_innovation",
]);

export type ScryfallSet = {
  code: string;
  name: string;
  releasedAt: string;
  iconSvgUri: string;
};

// Full Scryfall card shape is large; this is the subset we currently read.
// Additional fields are passed through unmodified to consumers that need them.
export type ScryfallCard = {
  id: string;
  name: string;
  type_line?: string;
  oracle_text?: string;
  flavor_text?: string;
  image_uris?: { normal: string };
  card_faces?: Array<{
    image_uris?: { normal: string };
    name: string;
    type_line?: string;
    oracle_text?: string;
    flavor_text?: string;
  }>;
};

let setListCache: ScryfallSet[] | null = null;
let lastRequestAt = 0;
let throttleChain: Promise<void> = Promise.resolve();

// Serialize all outbound requests through a single chain so that even
// concurrent callers respect the 75ms gap. Each caller awaits the previous
// caller's slot before claiming its own.
function throttle(): Promise<void> {
  const slot = throttleChain.then(async () => {
    const wait = Math.max(0, lastRequestAt + RATE_LIMIT_MS - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
  });
  throttleChain = slot.catch(() => {});
  return slot;
}

// Test-only reset. Not exported via index, but available to tests that
// import this module directly.
export function _resetScryfallStateForTests(): void {
  setListCache = null;
  lastRequestAt = 0;
  throttleChain = Promise.resolve();
}

export async function fetchSetList(): Promise<ScryfallSet[]> {
  if (setListCache) return setListCache;

  await throttle();
  const res = await fetch("https://api.scryfall.com/sets");
  if (!res.ok) throw new Error(`Scryfall /sets failed: ${res.status}`);

  const json = await res.json();
  const raw = json.data as Array<{
    code: string;
    name: string;
    set_type: string;
    released_at?: string;
    icon_svg_uri?: string;
  }>;

  const filtered = raw
    .filter((s) => DRAFTABLE_SET_TYPES.has(s.set_type))
    .map((s) => ({
      code: s.code,
      name: s.name,
      releasedAt: s.released_at ?? "",
      iconSvgUri: s.icon_svg_uri ?? "",
    }))
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));

  setListCache = filtered;
  return filtered;
}

export async function fetchBoosterPack(setCode: string): Promise<ScryfallCard[]> {
  await throttle();
  const res = await fetch(`https://api.scryfall.com/sets/${setCode}/booster`);
  if (!res.ok) throw new Error(`Scryfall booster failed for ${setCode}: ${res.status}`);

  const json = await res.json();
  return json.data as ScryfallCard[];
}
