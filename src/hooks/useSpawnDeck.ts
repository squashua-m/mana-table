import { useCallback, useState } from "react";
import { createShapeId, type Editor } from "tldraw";
import { CARD_HEIGHT, CARD_WIDTH } from "../shapes";
import { type DeckEntry } from "../utils/parseDecklist";
import { createDeck } from "../utils/stackOperations";

type ScryfallCard = {
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
        const id = createShapeId();

        try {
          const res = await fetch(
            `https://api.scryfall.com/cards/${entry.set}/${entry.collectorNumber}`
          );
          if (!res.ok) throw new Error(`${res.status}`);

          const card: ScryfallCard = await res.json();
          const face = card.card_faces?.[0];
          const imageUrl = card.image_uris?.normal ?? face?.image_uris?.normal ?? "";
          const typeLine = card.type_line ?? face?.type_line ?? "";
          const oracleText = card.oracle_text ?? face?.oracle_text ?? "";
          const flavorText = card.flavor_text ?? face?.flavor_text ?? "";

          editor.createShape({
            id,
            type: "mtg-card",
            x: anchorX,
            y: anchorY,
            props: {
              imageUrl,
              cardName: card.name,
              typeLine,
              oracleText,
              flavorText,
              isFlipped: true,
              isTapped: false,
              w: CARD_WIDTH,
              h: CARD_HEIGHT,
            },
          });
        } catch {
          editor.createShape({
            id,
            type: "mtg-card",
            x: anchorX,
            y: anchorY,
            props: {
              imageUrl: "",
              cardName: entry.name,
              typeLine: "",
              oracleText: "",
              flavorText: "",
              isFlipped: true,
              isTapped: false,
              w: CARD_WIDTH,
              h: CARD_HEIGHT,
            },
          });
        }

        shapeIds.push(id);
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
