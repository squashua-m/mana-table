import { useEffect, useMemo } from "react";
import { LiveList } from "@liveblocks/client";
import { Heading, Text } from "@canopy-ds/react";
import {
  useMutation,
  useMyPresence,
  useOthers,
  useSelf,
  useStorage,
  useUpdateMyPresence,
} from "../liveblocks.config";
import type { ScryfallCard } from "../utils/scryfall";
import {
  CARDS_PER_PACK,
  TOTAL_ROUNDS,
  nextSeat,
  passDirection,
} from "../utils/draftEngine";

const pageStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "var(--canopy-ds-color-surface-surface-base)",
  display: "grid",
  gridTemplateColumns: "1fr 280px",
  gap: "var(--canopy-ds-spacing-lg)",
  padding: "var(--canopy-ds-spacing-lg)",
  overflow: "hidden",
};

const mainStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-md)",
  overflowY: "auto",
  minWidth: 0,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--canopy-ds-spacing-md)",
  flexWrap: "wrap",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "var(--canopy-ds-spacing-md)",
  width: "100%",
};

const cardWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-2xs)",
};

const cardButtonStyle: React.CSSProperties = {
  appearance: "none",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-2xs)",
  transition:
    "transform var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-out, ease-out)",
};

const cardImageStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "200 / 279",
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
  objectFit: "cover",
};

const sidebarStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-sm)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-md)",
  padding: "var(--canopy-ds-spacing-md)",
  overflowY: "auto",
  minWidth: 0,
};

const poolListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-2xs)",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const waitingStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-xs)",
  padding: "var(--canopy-ds-spacing-xs) var(--canopy-ds-spacing-sm)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
};

function cardImageUrl(card: ScryfallCard): string {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? "";
}

export function DraftRoom() {
  const self = useSelf();
  const myId = self?.connectionId ?? null;
  const [myPresence] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();

  const draftState = useStorage((root) => root.draft?.state ?? "idle");
  const setName = useStorage((root) => root.draft?.setName ?? null);
  const currentRound = useStorage((root) => root.draft?.currentRound ?? 1);
  const pickNumber = useStorage((root) => root.draft?.pickNumber ?? 1);
  const drafters = useStorage((root) => root.draft?.drafters ?? null);
  const packs = useStorage((root) => root.draft?.packs ?? null);
  const seatPacks = useStorage((root) => root.draft?.seatPacks ?? null);
  const picks = useStorage((root) => root.draft?.picks ?? null);

  const myPack = (() => {
    if (myId === null || !drafters || !packs || !seatPacks) return null;
    const myHeldIndices = seatPacks.get(String(myId));
    if (!myHeldIndices || myHeldIndices.length === 0) return null;
    const currentPackIdx = myHeldIndices[0];
    return packs[currentPackIdx] ?? null;
  })();

  const myPool: readonly ScryfallCard[] = useMemo(() => {
    if (myId === null || !picks) return [];
    return picks.get(String(myId)) ?? [];
  }, [picks, myId]);

  const pickCard = useMutation(({ storage, self: me }, card: ScryfallCard) => {
    const draft = storage.get("draft");
    if (draft.get("state") !== "drafting") return;

    const mySeat = me.connectionId;
    const sp = draft.get("seatPacks");
    const queue = sp.get(String(mySeat));
    if (!queue || queue.length === 0) return;
    const packIdx = queue.get(0);
    if (packIdx === undefined) return;

    const packsList = draft.get("packs");
    const pack = packsList.get(packIdx);
    if (!pack) return;

    const cards = pack.get("cards");
    const cardIdx = cards.findIndex((c) => c.id === card.id);
    if (cardIdx === -1) return;

    const picksMap = draft.get("picks");
    const myList = picksMap.get(String(mySeat));
    const round = draft.get("currentRound");
    const pn = draft.get("pickNumber");
    const expectedBefore = (round - 1) * CARDS_PER_PACK + (pn - 1);
    if ((myList?.length ?? 0) > expectedBefore) return; // already picked

    pack.update({
      cards: [...cards.slice(0, cardIdx), ...cards.slice(cardIdx + 1)],
    });

    if (!myList) {
      picksMap.set(String(mySeat), new LiveList<ScryfallCard>([card]));
    } else {
      myList.push(card);
    }
  }, []);

  // Mirrors draftEngine.advanceRoundIfReady. Runs inside an LB transaction so
  // multiple clients racing on the final pick is safe — the guard re-checks
  // readiness against current storage and no-ops if another client beat us.
  const advanceIfReady = useMutation(({ storage }) => {
    const draft = storage.get("draft");
    if (draft.get("state") !== "drafting") return;

    const drafterIds = draft.get("drafters").toImmutable();
    if (drafterIds.length === 0) return;

    const round = draft.get("currentRound");
    const pn = draft.get("pickNumber");
    const target = (round - 1) * CARDS_PER_PACK + pn;

    const picksMap = draft.get("picks");
    const allPicked = drafterIds.every(
      (seat) => (picksMap.get(String(seat))?.length ?? 0) >= target
    );
    if (!allPicked) return;

    const sp = draft.get("seatPacks");

    // Snapshot what each seat currently holds before we reassign.
    const held = new Map<number, number>();
    for (const seat of drafterIds) {
      const queue = sp.get(String(seat));
      if (!queue || queue.length === 0) continue;
      const idx = queue.get(0);
      if (idx !== undefined) held.set(seat, idx);
    }

    if (pn < CARDS_PER_PACK) {
      const direction = passDirection(round);
      for (const seat of drafterIds) {
        const packIdx = held.get(seat);
        if (packIdx === undefined) continue;
        const passTo = nextSeat(seat, direction, drafterIds as readonly number[]);
        sp.set(String(passTo), new LiveList<number>([packIdx]));
      }
      draft.update({ pickNumber: pn + 1 });
      return;
    }

    if (round < TOTAL_ROUNDS) {
      const nextRound = round + 1;
      drafterIds.forEach((seat, seatIdx) => {
        const packIdx = (nextRound - 1) * drafterIds.length + seatIdx;
        sp.set(String(seat), new LiveList<number>([packIdx]));
      });
      draft.update({ currentRound: nextRound, pickNumber: 1 });
      return;
    }

    // Round 3, pick 15: draft is complete. Empty all queues and flip state.
    for (const seat of drafterIds) {
      sp.set(String(seat), new LiveList<number>([]));
    }
    draft.update({ state: "playing" });
  }, []);

  const handlePick = (card: ScryfallCard) => {
    if (myPresence.pickedThisRound) return;
    if (draftState !== "drafting") return;
    pickCard(card);
    updateMyPresence({ pickedThisRound: true });
  };

  // Coordinator: when every drafter (self + relevant others) has flipped
  // pickedThisRound, fire the advance transaction. All clients may fire — the
  // LB transaction + storage re-check makes it idempotent.
  const draftersPickedCount = useMemo(() => {
    if (!drafters) return 0;
    const presenceById = new Map<number, boolean>();
    presenceById.set(myId ?? -1, myPresence.pickedThisRound);
    for (const o of others) {
      presenceById.set(o.connectionId, o.presence.pickedThisRound);
    }
    return drafters.reduce(
      (n, seat) => n + (presenceById.get(seat) ? 1 : 0),
      0
    );
  }, [drafters, others, myId, myPresence.pickedThisRound]);

  useEffect(() => {
    if (!drafters || drafters.length === 0) return;
    if (!myPresence.pickedThisRound) return;
    if (draftersPickedCount < drafters.length) return;
    advanceIfReady();
  }, [drafters, draftersPickedCount, myPresence.pickedThisRound, advanceIfReady]);

  // Reset own pickedThisRound flag when the round/pick advances so we can
  // pick again. Also resets on mount and on completion.
  useEffect(() => {
    updateMyPresence({ pickedThisRound: false });
  }, [currentRound, pickNumber, draftState, updateMyPresence]);

  // Once the draft completes (state="playing"), the drafter moves privately
  // to the deck builder. Spectators (still in the lobby) skip straight to
  // canvas — that's handled in AppShell.
  useEffect(() => {
    if (draftState === "playing" && myPresence.screen === "draft") {
      updateMyPresence({ screen: "deck-build" });
    }
  }, [draftState, myPresence.screen, updateMyPresence]);

  const waitingOn: string[] = useMemo(() => {
    if (!drafters || !myPresence.pickedThisRound) return [];
    const result: string[] = [];
    for (const seat of drafters) {
      if (seat === myId) continue;
      const other = others.find((o) => o.connectionId === seat);
      if (!other) continue; // disconnected — pack blocks, per PRD
      if (!other.presence.pickedThisRound) {
        result.push(other.presence.username);
      }
    }
    return result;
  }, [drafters, others, myId, myPresence.pickedThisRound]);

  return (
    <div style={pageStyle}>
      <div style={mainStyle}>
        <div style={headerStyle}>
          <Heading
            level={1}
            variant="display-02"
            style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
          >
            Pack {currentRound}/{TOTAL_ROUNDS}
          </Heading>
          <Text
            variant="headline-02"
            as="span"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
          >
            Pick {pickNumber}/{CARDS_PER_PACK}
          </Text>
          {setName && (
            <Text
              variant="body-01"
              as="span"
              style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
            >
              · {setName}
            </Text>
          )}
        </div>

        {myPresence.pickedThisRound && (
          <div style={waitingStyle} role="status" aria-live="polite">
            <Text
              variant="body-01"
              as="span"
              style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}
            >
              {waitingOn.length === 0
                ? "Passing pack…"
                : `Waiting on ${waitingOn.join(", ")}`}
            </Text>
          </div>
        )}

        {myPack && myPack.cards.length > 0 ? (
          <div style={gridStyle}>
            {myPack.cards.map((card, i) => {
              const disabled = myPresence.pickedThisRound;
              const url = cardImageUrl(card);
              return (
                <button
                  key={`${card.id}-${i}`}
                  type="button"
                  onClick={() => handlePick(card)}
                  disabled={disabled}
                  aria-label={`Pick ${card.name}`}
                  style={{
                    ...cardButtonStyle,
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled ? 0.55 : 1,
                  }}
                >
                  <div style={cardWrapStyle}>
                    {url ? (
                      <img src={url} alt={card.name} style={cardImageStyle} />
                    ) : (
                      <div
                        style={{
                          ...cardImageStyle,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "var(--canopy-ds-spacing-xs)",
                          textAlign: "center",
                        }}
                      >
                        <Text
                          variant="caption-01"
                          as="span"
                          style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
                        >
                          {card.name}
                        </Text>
                      </div>
                    )}
                    <Text
                      variant="caption-01"
                      as="span"
                      style={{
                        color: "var(--canopy-ds-color-text-icon-text-default)",
                        textAlign: "center",
                      }}
                    >
                      {card.name}
                    </Text>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Text
            variant="body-01"
            as="p"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
          >
            Waiting for a pack…
          </Text>
        )}
      </div>

      <aside style={sidebarStyle} aria-label="Your pool">
        <Heading
          level={2}
          variant="headline-02"
          style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
        >
          Pool ({myPool.length})
        </Heading>
        {myPool.length === 0 ? (
          <Text
            variant="body-01"
            as="p"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)", margin: 0 }}
          >
            No picks yet.
          </Text>
        ) : (
          <ol style={poolListStyle}>
            {myPool.map((card, i) => (
              <li key={`${card.id}-${i}`}>
                <Text
                  variant="caption-01"
                  as="span"
                  style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}
                >
                  {i + 1}. {card.name}
                </Text>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
