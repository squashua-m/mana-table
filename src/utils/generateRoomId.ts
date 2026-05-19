// Slug-style room IDs that double as type-friendly join codes.
// Format: `<adjective>-<noun>-NN` (NN = 10–99). ~100k combinations is
// vastly more than enough for the per-session collision space here.

const ADJECTIVES = [
  "quiet", "swift", "brave", "calm", "eager", "bright", "gentle", "lucky",
  "merry", "nimble", "proud", "quick", "rapid", "ready", "sharp", "smooth",
  "solid", "stable", "sturdy", "sunny", "super", "sweet", "tidy", "vast",
  "wild", "witty", "brisk", "clever", "cosmic", "daring", "fierce", "mighty",
] as const;

const NOUNS = [
  "tiger", "eagle", "river", "cloud", "stone", "dragon", "phoenix", "raven",
  "falcon", "wolf", "bear", "lynx", "otter", "fox", "owl", "hawk",
  "lion", "panda", "comet", "planet", "harbor", "valley", "meadow", "garden",
  "island", "ocean", "summit", "ember", "spark", "flame", "forest", "mesa",
] as const;

export function generateRoomId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const n = 10 + Math.floor(Math.random() * 90);
  return `${adj}-${noun}-${n}`;
}

// Accepts a raw code or a pasted URL containing `?room=…`. Returns a
// normalized id (lowercase, trimmed, only `a-z0-9-`) or null if empty.
export function normalizeRoomId(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  // Pasted URL form: extract ?room= value.
  const m = s.match(/[?&]room=([^&#\s]+)/i);
  if (m) s = decodeURIComponent(m[1]);

  s = s.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return s || null;
}
