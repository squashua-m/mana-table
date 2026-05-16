// Pure draft-engine functions. No Liveblocks, no React.
// State is plain JS so it's trivially testable; the React layer adapts the
// outputs of these functions into Liveblocks transactions.

export type SeatId = number;
export type Direction = "L" | "R";

export const CARDS_PER_PACK = 15;
export const TOTAL_ROUNDS = 3;
export const TOTAL_PICKS = CARDS_PER_PACK * TOTAL_ROUNDS;

export type EnginePack = {
  id: string;
  round: number;
  cards: Array<{ id: string }>;
};

export type EngineDraftState = {
  state: "drafting" | "playing";
  drafters: SeatId[];
  packs: EnginePack[];
  // Queue of pack indices held by each seat. Front of the queue is the seat's
  // current pack. With no pick timer, each seat holds exactly one pack at a
  // time, but the queue shape leaves room for future variants.
  seatPacks: Record<string, number[]>;
  // Chronological list of picked card ids per seat.
  picks: Record<string, string[]>;
  currentRound: number; // 1..TOTAL_ROUNDS
  pickNumber: number; // 1..CARDS_PER_PACK
};

// Pack 1 passes left, pack 2 right, pack 3 left.
export function passDirection(round: number): Direction {
  return round === 2 ? "R" : "L";
}

// "Left" = next index in the drafters array (wrap around).
// "Right" = previous index (wrap around).
export function nextSeat(
  seatId: SeatId,
  direction: Direction,
  drafters: readonly SeatId[]
): SeatId {
  const idx = drafters.indexOf(seatId);
  if (idx === -1) throw new Error(`nextSeat: seat ${seatId} not in drafters`);
  const n = drafters.length;
  const delta = direction === "L" ? 1 : -1;
  const nextIdx = ((idx + delta) % n + n) % n;
  return drafters[nextIdx];
}

// Returns the expected pool size for a seat that has just finished pick
// `pickNumber` of round `currentRound`.
function expectedPicksAfter(currentRound: number, pickNumber: number): number {
  return (currentRound - 1) * CARDS_PER_PACK + pickNumber;
}

// Apply a single pick: remove `cardId` from the seat's current pack and
// append it to the seat's pool. No pack-passing — that's `advanceRoundIfReady`.
// No-op if the seat has already picked this round (defends against double
// clicks slipping through the UI).
export function applyPick(
  state: EngineDraftState,
  seatId: SeatId,
  cardId: string
): EngineDraftState {
  const seatKey = String(seatId);
  const queue = state.seatPacks[seatKey];
  if (!queue || queue.length === 0) {
    throw new Error(`applyPick: no pack at seat ${seatId}`);
  }
  const packIdx = queue[0];
  const pack = state.packs[packIdx];
  if (!pack) throw new Error(`applyPick: pack ${packIdx} missing`);

  const existingPicks = state.picks[seatKey] ?? [];
  const expectedBefore = expectedPicksAfter(state.currentRound, state.pickNumber - 1);
  if (existingPicks.length > expectedBefore) return state;

  const cardIdx = pack.cards.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) {
    throw new Error(`applyPick: card ${cardId} not in pack ${packIdx}`);
  }

  const newPack: EnginePack = {
    ...pack,
    cards: [...pack.cards.slice(0, cardIdx), ...pack.cards.slice(cardIdx + 1)],
  };
  const newPacks = state.packs.map((p, i) => (i === packIdx ? newPack : p));
  const newPicks = { ...state.picks, [seatKey]: [...existingPicks, cardId] };

  return { ...state, packs: newPacks, picks: newPicks };
}

// If every drafter has finished the current pick, transition: pass packs
// within the round, or deal next round's packs, or end the draft.
// Returns the input state unchanged when not ready (or when not drafting).
export function advanceRoundIfReady(state: EngineDraftState): EngineDraftState {
  if (state.state !== "drafting") return state;
  if (state.drafters.length === 0) return state;

  const target = expectedPicksAfter(state.currentRound, state.pickNumber);
  const allPicked = state.drafters.every(
    (seat) => (state.picks[String(seat)]?.length ?? 0) >= target
  );
  if (!allPicked) return state;

  // Mid-round: pass packs to the next seat.
  if (state.pickNumber < CARDS_PER_PACK) {
    const direction = passDirection(state.currentRound);
    const newSeatPacks: Record<string, number[]> = {};
    for (const seat of state.drafters) {
      const queue = state.seatPacks[String(seat)] ?? [];
      if (queue.length === 0) continue;
      const passTo = nextSeat(seat, direction, state.drafters);
      newSeatPacks[String(passTo)] = [queue[0]];
    }
    return { ...state, seatPacks: newSeatPacks, pickNumber: state.pickNumber + 1 };
  }

  // End of round.
  if (state.currentRound < TOTAL_ROUNDS) {
    const nextRound = state.currentRound + 1;
    const newSeatPacks: Record<string, number[]> = {};
    state.drafters.forEach((seat, seatIdx) => {
      const packIdx = (nextRound - 1) * state.drafters.length + seatIdx;
      newSeatPacks[String(seat)] = [packIdx];
    });
    return {
      ...state,
      seatPacks: newSeatPacks,
      currentRound: nextRound,
      pickNumber: 1,
    };
  }

  // End of pack 3, pick 15: draft is done.
  return { ...state, state: "playing", seatPacks: {} };
}
