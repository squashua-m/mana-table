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
  rarity?: "common" | "uncommon" | "rare" | "mythic" | "special" | "bonus";
  // Mana cost in Scryfall format, e.g. "{2}{R}{R}". DFC/MDFC cards have no
  // top-level mana_cost — read from `card_faces[0].mana_cost` instead.
  mana_cost?: string;
  image_uris?: { normal: string };
  card_faces?: Array<{
    image_uris?: { normal: string };
    name: string;
    type_line?: string;
    oracle_text?: string;
    flavor_text?: string;
    mana_cost?: string;
  }>;
};

let setListCache: ScryfallSet[] | null = null;
let lastRequestAt = 0;
let throttleChain: Promise<void> = Promise.resolve();
let symbologyPromise: Promise<Map<string, string>> | null = null;
const namedCardCache = new Map<string, Promise<ScryfallCard>>();
const setCardsCache = new Map<string, Promise<ScryfallCard[]>>();

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
  namedCardCache.clear();
  setCardsCache.clear();
  symbologyPromise = null;
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

  // Filter to released draftable sets. Scryfall lists announced-but-
  // unreleased sets (e.g. Reality Fracture) whose cards aren't searchable yet,
  // so picking them would produce empty packs.
  const today = new Date().toISOString().slice(0, 10);
  const filtered = raw
    .filter(
      (s) =>
        DRAFTABLE_SET_TYPES.has(s.set_type) &&
        (!s.released_at || s.released_at <= today)
    )
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

// Fetches every card in a set via `/cards/search` (paginated, ~175/page).
// Scryfall's old `/sets/{code}/booster` endpoint no longer exists, so we
// build packs client-side from the full card list.
async function fetchAllSetCards(setCode: string): Promise<ScryfallCard[]> {
  const cached = setCardsCache.get(setCode);
  if (cached) return cached;

  const promise = (async () => {
    const cards: ScryfallCard[] = [];
    let nextUrl: string | null = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(
      `e:${setCode}`
    )}&unique=cards`;
    while (nextUrl) {
      await throttle();
      const res = await fetch(nextUrl);
      if (!res.ok) {
        throw new Error(`Scryfall search failed for ${setCode}: ${res.status}`);
      }
      const json = (await res.json()) as {
        data: ScryfallCard[];
        has_more?: boolean;
        next_page?: string;
      };
      cards.push(...json.data);
      nextUrl = json.has_more && json.next_page ? json.next_page : null;
    }
    return cards;
  })();

  setCardsCache.set(setCode, promise);
  promise.catch(() => setCardsCache.delete(setCode));
  return promise;
}

const PACK_SIZE = 15;
const MYTHIC_RATIO = 1 / 8;

// Builds a 15-card pack from a set's card pool using standard rare-slot
// rarity distribution: 1 rare/mythic (mythic 1-in-8), 3 uncommons, 10 commons,
// plus a 1-card token slot left to commons for simplicity. Basic lands are
// excluded — the deck-builder spawns them from the basics endpoint instead.
export function buildPackFromCards(cards: ScryfallCard[]): ScryfallCard[] {
  const commons: ScryfallCard[] = [];
  const uncommons: ScryfallCard[] = [];
  const rares: ScryfallCard[] = [];
  const mythics: ScryfallCard[] = [];

  for (const c of cards) {
    if (c.type_line?.startsWith("Basic Land")) continue;
    if (c.rarity === "common") commons.push(c);
    else if (c.rarity === "uncommon") uncommons.push(c);
    else if (c.rarity === "rare") rares.push(c);
    else if (c.rarity === "mythic") mythics.push(c);
  }

  const pack: ScryfallCard[] = [];
  const taken = new Set<string>();

  const drawUnique = (pool: ScryfallCard[]): ScryfallCard | null => {
    if (pool.length === 0) return null;
    for (let attempt = 0; attempt < 50; attempt++) {
      const c = pool[Math.floor(Math.random() * pool.length)];
      if (!taken.has(c.id)) {
        taken.add(c.id);
        return c;
      }
    }
    return null; // pool effectively exhausted
  };

  // Rare slot: 1-in-8 chance of mythic when mythics exist.
  const rareSlotPool =
    mythics.length > 0 && Math.random() < MYTHIC_RATIO ? mythics : rares;
  const rareCard =
    drawUnique(rareSlotPool) ??
    drawUnique(rares) ??
    drawUnique(mythics) ??
    drawUnique(uncommons) ??
    drawUnique(commons);
  if (rareCard) pack.push(rareCard);

  for (let i = 0; i < 3; i++) {
    const c = drawUnique(uncommons) ?? drawUnique(commons);
    if (c) pack.push(c);
  }

  while (pack.length < PACK_SIZE) {
    const c =
      drawUnique(commons) ??
      drawUnique(uncommons) ??
      drawUnique(rares) ??
      drawUnique(mythics);
    if (!c) break; // exhausted — set is smaller than a pack
    pack.push(c);
  }

  return pack;
}

export async function fetchBoosterPack(setCode: string): Promise<ScryfallCard[]> {
  const cards = await fetchAllSetCards(setCode);
  if (cards.length === 0) {
    throw new Error(`Scryfall returned no cards for set ${setCode}`);
  }
  return buildPackFromCards(cards);
}

// Symbology: Scryfall returns ~84 mana/cost symbols with hosted SVG URIs.
// Fetched once per session; the resulting map is keyed by the literal symbol
// (e.g. "{R}", "{2/W}") so callers can render `card.mana_cost` by tokenizing
// `/\{[^}]+\}/g` and looking up each match.
export function fetchManaSymbols(): Promise<Map<string, string>> {
  if (symbologyPromise) return symbologyPromise;
  symbologyPromise = (async () => {
    await throttle();
    const res = await fetch("https://api.scryfall.com/symbology");
    if (!res.ok) throw new Error(`Scryfall /symbology failed: ${res.status}`);
    const json = (await res.json()) as {
      data: Array<{ symbol: string; svg_uri: string }>;
    };
    const map = new Map<string, string>();
    for (const s of json.data) map.set(s.symbol, s.svg_uri);
    return map;
  })();
  symbologyPromise.catch(() => {
    symbologyPromise = null;
  });
  return symbologyPromise;
}

// Fetch a card by exact name (Scryfall returns the most recent printing).
// Cached per-name across the session so basic-land lookups during deck spawn
// hit the network at most once each.
export async function fetchCardByName(name: string): Promise<ScryfallCard> {
  const cached = namedCardCache.get(name);
  if (cached) return cached;

  const promise = (async () => {
    await throttle();
    const res = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
    );
    if (!res.ok) {
      throw new Error(`Scryfall named lookup failed for "${name}": ${res.status}`);
    }
    return (await res.json()) as ScryfallCard;
  })();

  namedCardCache.set(name, promise);
  // Evict on failure so subsequent calls retry rather than re-throwing forever.
  promise.catch(() => namedCardCache.delete(name));
  return promise;
}
