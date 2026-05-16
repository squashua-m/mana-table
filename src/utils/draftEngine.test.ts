import { describe, expect, it } from "vitest";
import {
  CARDS_PER_PACK,
  TOTAL_PICKS,
  TOTAL_ROUNDS,
  advanceRoundIfReady,
  applyPick,
  nextSeat,
  passDirection,
  type EngineDraftState,
  type EnginePack,
  type SeatId,
} from "./draftEngine";

function makePack(id: string, round: number): EnginePack {
  return {
    id,
    round,
    cards: Array.from({ length: CARDS_PER_PACK }, (_, i) => ({
      id: `${id}-card-${i}`,
    })),
  };
}

function makeInitialState(podSize: number): EngineDraftState {
  const drafters: SeatId[] = Array.from({ length: podSize }, (_, i) => i + 100);
  const packs: EnginePack[] = [];
  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    for (let seatIdx = 0; seatIdx < podSize; seatIdx++) {
      packs.push(makePack(`r${round}-s${seatIdx}`, round));
    }
  }
  const seatPacks: Record<string, number[]> = {};
  drafters.forEach((seat, seatIdx) => {
    seatPacks[String(seat)] = [seatIdx];
  });
  const picks: Record<string, string[]> = {};
  drafters.forEach((seat) => {
    picks[String(seat)] = [];
  });
  return {
    state: "drafting",
    drafters,
    packs,
    seatPacks,
    picks,
    currentRound: 1,
    pickNumber: 1,
  };
}

// Pick whatever card is currently on top of every seat's pack, then run
// advanceRoundIfReady once. Convenient for stepping a draft forward.
function everyonePicks(state: EngineDraftState): EngineDraftState {
  let next = state;
  for (const seat of next.drafters) {
    const packIdx = next.seatPacks[String(seat)][0];
    const cardId = next.packs[packIdx].cards[0].id;
    next = applyPick(next, seat, cardId);
  }
  return advanceRoundIfReady(next);
}

describe("passDirection", () => {
  it("passes left on rounds 1 and 3, right on round 2", () => {
    expect(passDirection(1)).toBe("L");
    expect(passDirection(2)).toBe("R");
    expect(passDirection(3)).toBe("L");
  });
});

describe("nextSeat", () => {
  it("wraps around for a 2-player pod", () => {
    const pod = [10, 20];
    expect(nextSeat(10, "L", pod)).toBe(20);
    expect(nextSeat(20, "L", pod)).toBe(10);
    expect(nextSeat(10, "R", pod)).toBe(20);
    expect(nextSeat(20, "R", pod)).toBe(10);
  });

  it("wraps around for a 4-player pod", () => {
    const pod = [1, 2, 3, 4];
    expect(nextSeat(1, "L", pod)).toBe(2);
    expect(nextSeat(4, "L", pod)).toBe(1);
    expect(nextSeat(1, "R", pod)).toBe(4);
    expect(nextSeat(3, "R", pod)).toBe(2);
  });

  it("wraps around for an 8-player pod", () => {
    const pod = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(nextSeat(8, "L", pod)).toBe(1);
    expect(nextSeat(1, "R", pod)).toBe(8);
    expect(nextSeat(5, "L", pod)).toBe(6);
    expect(nextSeat(5, "R", pod)).toBe(4);
  });

  it("throws when the seat is not in the pod", () => {
    expect(() => nextSeat(99, "L", [1, 2, 3])).toThrow(/not in drafters/);
  });
});

describe("applyPick", () => {
  it("returns a new state without mutating the input", () => {
    const before = makeInitialState(4);
    const snapshot = JSON.stringify(before);
    const after = applyPick(before, before.drafters[0], before.packs[0].cards[0].id);

    expect(after).not.toBe(before);
    expect(after.packs).not.toBe(before.packs);
    expect(after.picks).not.toBe(before.picks);
    // Original packs and picks untouched
    expect(JSON.stringify(before)).toBe(snapshot);
    // Pack lost one card; pool gained one
    expect(after.packs[0].cards).toHaveLength(CARDS_PER_PACK - 1);
    expect(after.picks[String(before.drafters[0])]).toHaveLength(1);
  });

  it("is a no-op when a seat tries to pick twice before the round advances", () => {
    const before = makeInitialState(4);
    const seat = before.drafters[0];
    const first = applyPick(before, seat, before.packs[0].cards[0].id);
    const second = applyPick(first, seat, first.packs[0].cards[0].id);
    expect(second).toBe(first);
    expect(second.picks[String(seat)]).toHaveLength(1);
  });

  it("throws when the picked card is not in the seat's current pack", () => {
    const state = makeInitialState(4);
    expect(() => applyPick(state, state.drafters[0], "ghost-card")).toThrow(/not in pack/);
  });
});

describe("advanceRoundIfReady", () => {
  it("does not advance while any drafter has not yet picked", () => {
    let state = makeInitialState(4);
    state = applyPick(state, state.drafters[0], state.packs[0].cards[0].id);
    const before = state;
    const after = advanceRoundIfReady(state);
    expect(after).toBe(before);
    expect(after.pickNumber).toBe(1);
  });

  it("passes packs left after pick 1 of round 1", () => {
    let state = makeInitialState(4);
    const heldPackIds = state.drafters.map(
      (seat) => state.packs[state.seatPacks[String(seat)][0]].id
    );

    state = everyonePicks(state);

    expect(state.pickNumber).toBe(2);
    expect(state.currentRound).toBe(1);
    // pod[i] should now hold the pack that pod[i-1] used to hold (pass-left)
    const newHeldPackIds = state.drafters.map(
      (seat) => state.packs[state.seatPacks[String(seat)][0]].id
    );
    expect(newHeldPackIds).toEqual([
      heldPackIds[heldPackIds.length - 1],
      ...heldPackIds.slice(0, -1),
    ]);
  });

  it("passes packs right during round 2", () => {
    let state = makeInitialState(4);
    // Burn through round 1
    for (let p = 0; p < CARDS_PER_PACK; p++) {
      state = everyonePicks(state);
    }
    expect(state.currentRound).toBe(2);
    expect(state.pickNumber).toBe(1);

    const heldPackIds = state.drafters.map(
      (seat) => state.packs[state.seatPacks[String(seat)][0]].id
    );
    state = everyonePicks(state);
    const newHeldPackIds = state.drafters.map(
      (seat) => state.packs[state.seatPacks[String(seat)][0]].id
    );
    // Pass right: pod[i] now holds the pack that pod[i+1] used to hold
    expect(newHeldPackIds).toEqual([...heldPackIds.slice(1), heldPackIds[0]]);
  });

  it("transitions from end-of-round to next round with fresh packs and pickNumber=1", () => {
    let state = makeInitialState(4);
    for (let p = 0; p < CARDS_PER_PACK; p++) {
      state = everyonePicks(state);
    }
    expect(state.currentRound).toBe(2);
    expect(state.pickNumber).toBe(1);
    // Each seat should now hold their round-2 starting pack
    state.drafters.forEach((seat, seatIdx) => {
      const packIdx = state.seatPacks[String(seat)][0];
      expect(state.packs[packIdx].round).toBe(2);
      // Round-2 starting pack for seat seatIdx lives at index 4 + seatIdx
      expect(packIdx).toBe(state.drafters.length + seatIdx);
    });
  });

  it("completes the draft after pick 45 and flips state to playing", () => {
    let state = makeInitialState(2);

    for (let i = 0; i < TOTAL_PICKS; i++) {
      state = everyonePicks(state);
    }

    expect(state.state).toBe("playing");
    expect(state.seatPacks).toEqual({});
    state.drafters.forEach((seat) => {
      expect(state.picks[String(seat)]).toHaveLength(TOTAL_PICKS);
    });
  });

  it("does nothing once the draft is in the playing state", () => {
    const state: EngineDraftState = {
      ...makeInitialState(4),
      state: "playing",
    };
    expect(advanceRoundIfReady(state)).toBe(state);
  });

  it("runs a full 8-player draft cleanly", () => {
    let state = makeInitialState(8);
    for (let i = 0; i < TOTAL_PICKS; i++) {
      state = everyonePicks(state);
    }
    expect(state.state).toBe("playing");
    state.drafters.forEach((seat) => {
      expect(state.picks[String(seat)]).toHaveLength(TOTAL_PICKS);
    });
  });
});
