import type { Editor } from "tldraw";
import { CARD_HEIGHT, CARD_WIDTH } from "../shapes";
import { BASIC_NAMES, type BasicName } from "./deckBuilder";
import { createCardShape } from "./cardShape";
import { createDeck } from "./stackOperations";
import { fetchCardByName, type ScryfallCard } from "./scryfall";

export type DeckAllocation = {
  main: ScryfallCard[];
  side: ScryfallCard[];
  basics: Record<BasicName, number>;
};

// Horizontal anchors are expressed relative to viewport center so the three
// stacks land in the user's visible area regardless of zoom.
const MAIN_OFFSET_X = -CARD_WIDTH * 2.5;
const BASICS_OFFSET_X = -CARD_WIDTH * 1.2;
const SIDEBOARD_OFFSET_X = CARD_WIDTH * 1.5;

async function resolveBasics(
  basics: Record<BasicName, number>
): Promise<ScryfallCard[]> {
  const out: ScryfallCard[] = [];
  for (const name of BASIC_NAMES) {
    const n = basics[name];
    if (n <= 0) continue;
    try {
      const card = await fetchCardByName(name);
      for (let i = 0; i < n; i++) out.push(card);
    } catch {
      // Basic land lookup failed (offline / Scryfall hiccup) — skip silently
      // so the main deck still lands on the canvas.
    }
  }
  return out;
}

function spawnStack(
  editor: Editor,
  cards: readonly ScryfallCard[],
  x: number,
  y: number,
  name: string,
  setActive: boolean
): void {
  if (cards.length === 0) return;
  const ids = cards.map((card) =>
    createCardShape(editor, card, { x, y, isFlipped: true })
  );
  createDeck(editor, ids, name, setActive);
}

// Spawns three face-down stacks on the canvas: main deck (library) at
// center-left, basics adjacent, and sideboard at center-right. Main and
// side spawn synchronously; basics arrive after Scryfall returns their
// card data. Main is created last in each phase so it remains the active
// deck for hotkey draws.
export async function spawnBuiltDeck(
  editor: Editor,
  allocation: DeckAllocation
): Promise<void> {
  const viewport = editor.getViewportPageBounds();
  const anchorY = viewport.midY - CARD_HEIGHT / 2;
  const mainX = viewport.midX + MAIN_OFFSET_X;
  const basicsX = viewport.midX + BASICS_OFFSET_X;
  const sideboardX = viewport.midX + SIDEBOARD_OFFSET_X;

  spawnStack(editor, allocation.side, sideboardX, anchorY, "Sideboard", false);
  spawnStack(editor, allocation.main, mainX, anchorY, "Main Deck", true);

  const basicCards = await resolveBasics(allocation.basics);
  if (basicCards.length > 0) {
    spawnStack(editor, basicCards, basicsX, anchorY, "Basics", false);
  }
}
