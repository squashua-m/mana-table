export type PeekCard = {
  id: string;
  imageUrl: string;
  cardName: string;
  typeLine: string;
  oracleText: string;
  flavorText: string;
};

let _isPeeking = false;
let _peekCards: PeekCard[] = [];
const subs = new Set<() => void>();

function notify() {
  for (const cb of subs) cb();
}

export function isPeekActive(): boolean {
  return _isPeeking;
}

export function getPeekCards(): PeekCard[] {
  return _peekCards;
}

export function subscribePeek(cb: () => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}

export function startPeek(): void {
  if (_isPeeking) return;
  _isPeeking = true;
  notify();
}

export function endPeek(): void {
  _isPeeking = false;
  _peekCards = [];
  notify();
}

export function addToPeek(card: PeekCard): void {
  _peekCards = [..._peekCards, card];
  notify();
}

export function removeFromPeek(id: string): void {
  _peekCards = _peekCards.filter((c) => c.id !== id);
  if (_peekCards.length === 0) {
    endPeek();
  } else {
    notify();
  }
}

export function reorderPeekCard(fromIndex: number, toIndex: number): void {
  if (fromIndex === toIndex) return;
  const next = [..._peekCards];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  _peekCards = next;
  notify();
}
