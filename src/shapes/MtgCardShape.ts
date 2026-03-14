import { type RecordProps, T, type TLBaseShape } from "tldraw";

export type MtgCardShapeProps = {
  imageUrl: string;
  isFlipped: boolean;
  isTapped: boolean;
  cardName: string;
  w: number;
  h: number;
};

export type MtgCardShape = TLBaseShape<"mtg-card", MtgCardShapeProps>;

export const mtgCardShapeProps: RecordProps<MtgCardShape> = {
  imageUrl: T.string,
  isFlipped: T.boolean,
  isTapped: T.boolean,
  cardName: T.string,
  w: T.number,
  h: T.number,
};

// Standard MTG card dimensions in pixels (63mm × 88mm scaled)
export const CARD_WIDTH = 200;
export const CARD_HEIGHT = 279;

// Generic Magic card back
export const CARD_BACK_URL =
  "https://upload.wikimedia.org/wikipedia/en/a/aa/Magic_the_gathering-card_back.jpg";
