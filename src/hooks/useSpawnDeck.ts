import { useCallback, useState } from "react";
import { type Editor } from "tldraw";
import { type DeckEntry } from "../utils/parseDecklist";
import { createDeck } from "../utils/stackOperations";
import { createCardShape, createPlaceholderCardShape } from "../utils/cardShape";
import type { ScryfallCard } from "../utils/scryfall";

// Scryfall asks for 50–100 ms between requests
const RATE_LIMIT_MS = 75;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type SpawnProgress = {
  loaded: number;
  total: number;
};

export function useSpawnDeck(editor: Editor | null) {
  const [progress, setProgress] = useState<SpawnProgress | null>(null);

  const spawnDeck = useCallback(
    async (entries: DeckEntry[]) => {
      if (!editor) return;

      // Expand entries by count so each copy is its own card
      const cards: DeckEntry[] = entries.flatMap((e) =>
        Array.from({ length: e.count }, () => e)
      );

      const total = cards.length;
      setProgress({ loaded: 0, total });

      // Anchor position: viewport top-left + padding
      const viewport = editor.getViewportPageBounds();
      const anchorX = viewport.minX + 32;
      const anchorY = viewport.minY + 32;

      // Collect all shape IDs as we create them
      const shapeIds: string[] = [];

      for (let i = 0; i < cards.length; i++) {
        const entry = cards[i];

        let shapeId: string;
        try {
          const res = await fetch(
            `https://api.scryfall.com/cards/${entry.set}/${entry.collectorNumber}`
          );
          if (!res.ok) throw new Error(`${res.status}`);

          const card: ScryfallCard = await res.json();
          shapeId = createCardShape(editor, card, {
            x: anchorX,
            y: anchorY,
            isFlipped: true,
          });
        } catch {
          shapeId = createPlaceholderCardShape(editor, entry.name, {
            x: anchorX,
            y: anchorY,
            isFlipped: true,
          });
        }

        shapeIds.push(shapeId);
        setProgress({ loaded: i + 1, total });

        if (i < cards.length - 1) await delay(RATE_LIMIT_MS);
      }

      // Group all cards into a deck stack
      const deckName = entries[0]?.name ?? "Deck";
      createDeck(editor, shapeIds, deckName);

      setProgress(null);
    },
    [editor]
  );

  return { spawnDeck, progress };
}
