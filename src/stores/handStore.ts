export type HandCard = {
  id: string;
  imageUrl: string;
  cardName: string;
};

let cards: HandCard[] = [];
const subs = new Set<() => void>();

function notify() {
  for (const cb of subs) cb();
}

export function getHandCards(): HandCard[] {
  return cards;
}

export function addToHand(card: HandCard): void {
  cards = [...cards, card];
  notify();
}

export function addManyToHand(newCards: HandCard[]): void {
  cards = [...cards, ...newCards];
  notify();
}

export function removeFromHand(id: string): void {
  cards = cards.filter((c) => c.id !== id);
  notify();
}

export function reorderCard(fromIndex: number, toIndex: number): void {
  if (fromIndex === toIndex) return;
  const next = [...cards];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  cards = next;
  notify();
}

export function subscribeHand(cb: () => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}
