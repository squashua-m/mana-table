import { createShapeId, type Editor, type TLShapeId } from "tldraw";
import { CARD_HEIGHT, CARD_WIDTH } from "../shapes";
import type { ScryfallCard } from "./scryfall";

export type CardShapeOptions = {
  x: number;
  y: number;
  isFlipped?: boolean;
  isTapped?: boolean;
};

// Creates an mtg-card shape from a Scryfall card JSON. DFCs fall back to the
// front face's image/type/oracle/flavor when the parent fields are absent.
export function createCardShape(
  editor: Editor,
  card: ScryfallCard,
  opts: CardShapeOptions
): TLShapeId {
  const face = card.card_faces?.[0];
  const imageUrl = card.image_uris?.normal ?? face?.image_uris?.normal ?? "";
  const typeLine = card.type_line ?? face?.type_line ?? "";
  const oracleText = card.oracle_text ?? face?.oracle_text ?? "";
  const flavorText = card.flavor_text ?? face?.flavor_text ?? "";

  const id = createShapeId();
  editor.createShape({
    id,
    type: "mtg-card",
    x: opts.x,
    y: opts.y,
    props: {
      imageUrl,
      cardName: card.name,
      typeLine,
      oracleText,
      flavorText,
      isFlipped: opts.isFlipped ?? false,
      isTapped: opts.isTapped ?? false,
      w: CARD_WIDTH,
      h: CARD_HEIGHT,
    },
  });
  return id;
}

// Image-less placeholder used when a Scryfall lookup fails — the card still
// participates in the deck so counts remain correct.
export function createPlaceholderCardShape(
  editor: Editor,
  cardName: string,
  opts: CardShapeOptions
): TLShapeId {
  const id = createShapeId();
  editor.createShape({
    id,
    type: "mtg-card",
    x: opts.x,
    y: opts.y,
    props: {
      imageUrl: "",
      cardName,
      typeLine: "",
      oracleText: "",
      flavorText: "",
      isFlipped: opts.isFlipped ?? false,
      isTapped: opts.isTapped ?? false,
      w: CARD_WIDTH,
      h: CARD_HEIGHT,
    },
  });
  return id;
}
