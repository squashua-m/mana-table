export type DeckEntry = {
  count: number;
  name: string;
  set: string;
  collectorNumber: string;
};

/**
 * Parses MTGA-format decklists into structured entries.
 *
 * Accepted line format: `4 Llanowar Elves (FDN) 227`
 * Section headers ("Deck", "Sideboard", "Commander") and blank lines are skipped.
 */
export function parseDecklist(text: string): DeckEntry[] {
  const entries: DeckEntry[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // Skip section headers
    if (/^(deck|sideboard|commander)$/i.test(line)) continue;

    const match = line.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)\s+(\S+)$/i);
    if (!match) continue;

    entries.push({
      count: parseInt(match[1], 10),
      name: match[2],
      set: match[3].toLowerCase(),
      collectorNumber: match[4],
    });
  }

  return entries;
}
