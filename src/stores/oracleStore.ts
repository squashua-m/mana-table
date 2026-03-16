/** Tracks oracle mode toggle and the currently hovered card's oracle data. */

export type HoveredCardOracle = {
  cardName: string;
  typeLine: string;
  oracleText: string;
  flavorText: string;
};

let _oracleMode = false;
let _hoveredCard: HoveredCardOracle | null = null;

const modeSubs = new Set<(v: boolean) => void>();
const hoverSubs = new Set<(v: HoveredCardOracle | null) => void>();

export function toggleOracleMode(): void {
  _oracleMode = !_oracleMode;
  for (const cb of modeSubs) cb(_oracleMode);
  if (!_oracleMode) setHoveredCard(null);
}

export function isOracleMode(): boolean {
  return _oracleMode;
}

export function subscribeOracleMode(cb: (v: boolean) => void): () => void {
  modeSubs.add(cb);
  return () => modeSubs.delete(cb);
}

export function setHoveredCard(card: HoveredCardOracle | null): void {
  _hoveredCard = card;
  for (const cb of hoverSubs) cb(card);
}

export function getHoveredCard(): HoveredCardOracle | null {
  return _hoveredCard;
}

export function subscribeHoveredCard(cb: (v: HoveredCardOracle | null) => void): () => void {
  hoverSubs.add(cb);
  return () => hoverSubs.delete(cb);
}
