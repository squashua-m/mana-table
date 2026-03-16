import { useCallback } from "react";
import { createShapeId, type Editor } from "tldraw";
import { CARD_HEIGHT, CARD_WIDTH } from "../shapes";

type ScryfallCard = {
  name: string;
  type_line?: string;
  oracle_text?: string;
  flavor_text?: string;
  image_uris?: { normal: string };
  // Double-faced cards (DFCs) store images under card_faces
  card_faces?: Array<{
    image_uris?: { normal: string };
    name: string;
    type_line?: string;
    oracle_text?: string;
    flavor_text?: string;
  }>;
};

export function useSpawnCard(editor: Editor | null) {
  return useCallback(async () => {
    if (!editor) return;

    const res = await fetch("https://api.scryfall.com/cards/random");
    if (!res.ok) throw new Error(`Scryfall fetch failed: ${res.status}`);

    const card: ScryfallCard = await res.json();

    // DFCs don't have top-level image_uris — fall back to card_faces[0]
    const face = card.card_faces?.[0];
    const imageUrl = card.image_uris?.normal ?? face?.image_uris?.normal ?? "";
    const typeLine = card.type_line ?? face?.type_line ?? "";
    const oracleText = card.oracle_text ?? face?.oracle_text ?? "";
    const flavorText = card.flavor_text ?? face?.flavor_text ?? "";

    // Place the card centered on the current viewport
    const screenCenter = editor.getViewportScreenCenter();
    const pagePoint = editor.screenToPage(screenCenter);

    editor.createShape({
      id: createShapeId(),
      type: "mtg-card",
      x: pagePoint.x - CARD_WIDTH / 2,
      y: pagePoint.y - CARD_HEIGHT / 2,
      props: {
        imageUrl,
        cardName: card.name,
        typeLine,
        oracleText,
        flavorText,
        isFlipped: false,
        w: CARD_WIDTH,
        h: CARD_HEIGHT,
      },
    });
  }, [editor]);
}
