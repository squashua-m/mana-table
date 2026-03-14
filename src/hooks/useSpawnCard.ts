import { useCallback } from "react";
import { createShapeId, type Editor } from "tldraw";
import { CARD_HEIGHT, CARD_WIDTH } from "../shapes";

type ScryfallCard = {
  name: string;
  image_uris?: { normal: string };
  // Double-faced cards (DFCs) store images under card_faces
  card_faces?: Array<{ image_uris?: { normal: string }; name: string }>;
};

export function useSpawnCard(editor: Editor | null) {
  return useCallback(async () => {
    if (!editor) return;

    const res = await fetch("https://api.scryfall.com/cards/random");
    if (!res.ok) throw new Error(`Scryfall fetch failed: ${res.status}`);

    const card: ScryfallCard = await res.json();

    // DFCs don't have top-level image_uris — fall back to card_faces[0]
    const imageUrl =
      card.image_uris?.normal ??
      card.card_faces?.[0]?.image_uris?.normal ??
      "";

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
        isFlipped: false,
        w: CARD_WIDTH,
        h: CARD_HEIGHT,
      },
    });
  }, [editor]);
}
