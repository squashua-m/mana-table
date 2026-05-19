import { useEffect, useMemo, useRef, useState } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { GlassButton, Heading, Icon, Text } from "@canopy-ds/react";
import {
  useMutation,
  useMyPresence,
  useOthers,
  useSelf,
  useStorage,
} from "../liveblocks.config";
import type { PackLson } from "../liveblocks.config";
import { SetPicker } from "../components/SetPicker";
import { HomeLink } from "../components/HomeLink";
import { fetchBoosterPack } from "../utils/scryfall";
import { CARDS_PER_PACK, TOTAL_ROUNDS } from "../utils/draftEngine";

const MAX_DRAFTERS = 8;

const pageStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "var(--canopy-ds-color-surface-surface-base)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--canopy-ds-spacing-lg)",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "var(--canopy-ds-spacing-lg)",
  width: "100%",
  maxWidth: 480,
};

const rosterStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-2xs)",
  padding: "var(--canopy-ds-spacing-sm)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-md)",
};

const spectatorPanelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-2xs)",
  padding: "var(--canopy-ds-spacing-md)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-md)",
};

const noticeStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-3xs)",
  padding: "var(--canopy-ds-spacing-sm) var(--canopy-ds-spacing-md)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-md)",
};

const rosterRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-xs)",
  padding: "var(--canopy-ds-spacing-2xs) var(--canopy-ds-spacing-xs)",
};

const roomCodePanelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-sm)",
  padding: "var(--canopy-ds-spacing-sm) var(--canopy-ds-spacing-md)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-md)",
};

const roomCodeButtonStyle: React.CSSProperties = {
  appearance: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-2xs)",
  marginLeft: "auto",
  padding: "var(--canopy-ds-spacing-2xs) var(--canopy-ds-spacing-xs)",
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
  color: "var(--canopy-ds-color-text-icon-text-default)",
  cursor: "pointer",
  font: "inherit",
  transition:
    "background var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-out, ease-out)",
};

type Role = "drafter" | "spectator" | null;

function PlayerRow({
  color,
  username,
  isSelf,
  isHost,
  role,
}: {
  color: string;
  username: string;
  isSelf: boolean;
  isHost: boolean;
  // null while the draft hasn't been committed (no drafter list yet) — pills
  // would be meaningless until then.
  role: Role;
}) {
  return (
    <div style={rosterRowStyle}>
      <span
        aria-hidden
        style={{
          width: 12,
          height: 12,
          borderRadius: "var(--canopy-ds-radius-round)",
          background: color,
          flexShrink: 0,
        }}
      />
      <Text
        variant="body-01"
        as="span"
        style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}
      >
        {username}
      </Text>
      {isSelf && (
        <Text
          variant="caption-01"
          as="span"
          style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
        >
          (you)
        </Text>
      )}
      {isHost && (
        <Text
          variant="caption-01"
          as="span"
          style={{ color: "var(--canopy-ds-color-text-icon-text-brand)" }}
        >
          host
        </Text>
      )}
      {role && (
        <span
          style={{
            marginLeft: "auto",
            padding: "var(--canopy-ds-spacing-3xs) var(--canopy-ds-spacing-xs)",
            borderRadius: "var(--canopy-ds-radius-round)",
            background: "var(--canopy-ds-color-surface-surface-level-2)",
            border: "1px solid var(--canopy-ds-color-border-border-default)",
          }}
        >
          <Text
            variant="caption-01"
            as="span"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
          >
            {role === "drafter" ? "Drafter" : "Spectator"}
          </Text>
        </span>
      )}
    </div>
  );
}

export function Lobby() {
  const [myPresence] = useMyPresence();
  const others = useOthers();
  const self = useSelf();

  const draftState = useStorage((root) => root.draft?.state ?? "idle");
  const hostId = useStorage((root) => root.draft?.hostId ?? null);
  const setCode = useStorage((root) => root.draft?.setCode ?? null);
  const setName = useStorage((root) => root.draft?.setName ?? null);
  const drafters = useStorage((root) => root.draft?.drafters ?? null);
  const currentRound = useStorage((root) => root.draft?.currentRound ?? 0);
  const pickNumber = useStorage((root) => root.draft?.pickNumber ?? 0);

  const playerCount = others.length + 1;
  const myConnectionId = self?.connectionId ?? null;
  const isHost = hostId !== null && hostId === myConnectionId;

  // `drafters` is empty while the host picks a set; once `commitDraftStart`
  // fires it becomes the canonical seat list. Spectators are anyone in the
  // room not in that list — including 9th+ players past the pod cap and
  // anyone who joined after the draft started.
  const drafterIds = useMemo(
    () => (drafters ? Array.from(drafters) : []),
    [drafters]
  );
  const draftCommitted = drafterIds.length > 0;
  const isDrafter =
    myConnectionId !== null && drafterIds.includes(myConnectionId);
  const isSpectator =
    draftState === "drafting" && draftCommitted && !isDrafter;

  const startNewDraft = useMutation(({ storage, self }) => {
    const draft = storage.get("draft");
    if (draft.get("state") !== "idle") return;
    draft.update({
      state: "drafting",
      hostId: self.connectionId,
    });
  }, []);

  const commitDraftStart = useMutation(
    ({ storage, self }, drafterIds: number[], packs: PackLson[]) => {
      const draft = storage.get("draft");
      if (draft.get("state") !== "drafting") return;
      if (draft.get("hostId") !== self.connectionId) return;
      if (!draft.get("setCode")) return;

      const draftersList = draft.get("drafters");
      drafterIds.forEach((id) => draftersList.push(id));

      const packsList = draft.get("packs");
      packs.forEach((p) => packsList.push(new LiveObject(p)));

      const seatPacks = draft.get("seatPacks");
      const picks = draft.get("picks");
      drafterIds.forEach((id, seatIdx) => {
        seatPacks.set(String(id), new LiveList<number>([seatIdx]));
        picks.set(String(id), new LiveList([]));
      });

      draft.update({ currentRound: 1, pickNumber: 1 });
    },
    []
  );

  const selectSet = useMutation(({ storage, self }, code: string, name: string) => {
    const draft = storage.get("draft");
    if (draft.get("hostId") !== self.connectionId) return;
    draft.update({ setCode: code, setName: name });
  }, []);

  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<{ loaded: number; total: number } | null>(null);

  // True if this client arrived by typing/pasting a join code on the landing
  // page (signalled by `?join=1`). Used to gate the "you're alone — check the
  // code" hint: hosts who clicked "New Draft" deliberately expect an empty
  // room and shouldn't see it.
  const [joinedViaCode] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("join") === "1";
  });

  // True if this client arrived from the landing page's "New Draft" button
  // (signalled by `?new=1`). Lets us auto-claim the host seat on arrival so
  // the user doesn't have to tap a second "New Draft" button in the lobby.
  const [arrivedAsNew] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("new") === "1";
  });

  const [roomCode] = useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("room");
  });
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail in non-secure contexts — fall back silently;
      // the code is still visible on-screen for the host to read aloud.
    }
  };

  // Clear the `join=1` and `new=1` flags from the URL once we've read them so
  // the hint/auto-host don't re-fire on refresh, and so a shared room URL
  // doesn't promote unintended hosts.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!joinedViaCode && !arrivedAsNew) return;
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.has("join")) {
      url.searchParams.delete("join");
      changed = true;
    }
    if (url.searchParams.has("new")) {
      url.searchParams.delete("new");
      changed = true;
    }
    if (changed) window.history.replaceState({}, "", url.toString());
  }, [joinedViaCode, arrivedAsNew]);

  // Auto-claim host on arrival from landing's New Draft. The startNewDraft
  // guard (`state !== "idle" return`) makes this idempotent — if a host has
  // already been claimed (e.g. shared URL race), the mutation no-ops.
  useEffect(() => {
    if (!arrivedAsNew) return;
    if (draftState !== "idle") return;
    if (myConnectionId === null) return;
    startNewDraft();
  }, [arrivedAsNew, draftState, myConnectionId, startNewDraft]);

  const showJoinMismatchHint =
    joinedViaCode && draftState === "idle" && playerCount === 1;

  const handleStartDraft = async () => {
    if (!setCode || myConnectionId === null) return;
    const drafterIds = [myConnectionId, ...others.map((o) => o.connectionId)].slice(0, MAX_DRAFTERS);
    const totalPacks = drafterIds.length * 3;

    setGenerating(true);
    setGenProgress({ loaded: 0, total: totalPacks });
    try {
      const packs: PackLson[] = [];
      for (let i = 0; i < totalPacks; i++) {
        const round = Math.floor(i / drafterIds.length) + 1;
        const cards = await fetchBoosterPack(setCode);
        packs.push({ id: `pack-${i}`, round, cards });
        setGenProgress({ loaded: i + 1, total: totalPacks });
      }
      commitDraftStart(drafterIds, packs);
    } catch (err) {
      console.error("Pack generation failed", err);
    } finally {
      setGenerating(false);
      setGenProgress(null);
    }
  };

  const subtitle = (() => {
    if (isSpectator) return "Draft in progress — you're spectating";
    if (draftState === "drafting" && isHost) return "You're the host. Pick a set and start when ready.";
    if (draftState === "drafting") {
      return setName
        ? `Host is setting up: ${setName}`
        : "Host is setting up the draft…";
    }
    return playerCount === 1 ? "1 player in the room" : `${playerCount} players in the room`;
  })();

  return (
    <div style={pageStyle}>
      <HomeLink />
      <div style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--canopy-ds-spacing-2xs)" }}>
          <Heading
            level={1}
            variant="display-01"
            style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
          >
            Mana Table
          </Heading>
          <Text
            variant="body-01"
            as="p"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)", margin: 0 }}
          >
            {subtitle}
          </Text>
        </div>

        {roomCode && (
          <div style={roomCodePanelStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--canopy-ds-spacing-3xs)" }}>
              <Text
                variant="caption-01"
                as="span"
                style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
              >
                Room code
              </Text>
              <Text
                variant="headline-02"
                as="span"
                style={{
                  color: "var(--canopy-ds-color-text-icon-text-default)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  letterSpacing: "0.02em",
                }}
              >
                {roomCode}
              </Text>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              style={roomCodeButtonStyle}
              aria-label={copied ? "Room code copied" : "Copy room code"}
            >
              <Icon name={copied ? "check" : "copy"} size="sm" />
              <Text variant="caption-01" as="span">
                {copied ? "Copied" : "Copy"}
              </Text>
            </button>
          </div>
        )}

        {showJoinMismatchHint && (
          <div style={noticeStyle} role="status" aria-live="polite">
            <Text
              variant="body-01"
              as="p"
              style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
            >
              Looks like you're the only one here.
            </Text>
            <Text
              variant="caption-01"
              as="span"
              style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
            >
              Double-check the code, or start a new draft and share the link.
            </Text>
          </div>
        )}

        {isSpectator && (
          <div style={spectatorPanelStyle} role="status" aria-live="polite">
            <Text
              variant="headline-02"
              as="p"
              style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
            >
              {setName ?? "Draft"} · Pack {currentRound}/{TOTAL_ROUNDS} · Pick {pickNumber}/{CARDS_PER_PACK}
            </Text>
            <Text
              variant="caption-01"
              as="span"
              style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
            >
              You'll join the canvas automatically when the draft finishes.
            </Text>
          </div>
        )}

        <div style={rosterStyle}>
          <PlayerRow
            color={myPresence.color}
            username={myPresence.username}
            isSelf
            isHost={isHost}
            role={
              draftCommitted ? (isDrafter ? "drafter" : "spectator") : null
            }
          />
          {others.map((other) => (
            <PlayerRow
              key={other.connectionId}
              color={other.presence.color}
              username={other.presence.username}
              isSelf={false}
              isHost={hostId !== null && hostId === other.connectionId}
              role={
                draftCommitted
                  ? drafterIds.includes(other.connectionId)
                    ? "drafter"
                    : "spectator"
                  : null
              }
            />
          ))}
        </div>

        {draftState === "idle" && (
          <GlassButton size="lg" onClick={() => startNewDraft()} aria-label="Start a new draft">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--canopy-ds-spacing-xs)",
                color: "var(--canopy-ds-color-text-icon-text-default)",
              }}
            >
              <Icon name="plus" size="sm" />
              <Text variant="headline-02" as="span">New Draft</Text>
            </span>
          </GlassButton>
        )}

        {draftState === "drafting" && isHost && (
          <>
            <SetPicker
              selectedCode={setCode}
              selectedName={setName}
              onSelect={(code, name) => selectSet(code, name)}
            />
            <GlassButton
              size="lg"
              onClick={handleStartDraft}
              aria-label="Start the draft"
              disabled={!setCode || generating}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--canopy-ds-spacing-xs)",
                  color: "var(--canopy-ds-color-text-icon-text-default)",
                }}
              >
                <Icon name={generating ? "loader" : "arrow-right"} size="sm" />
                <Text variant="headline-02" as="span">
                  {generating && genProgress
                    ? `Opening packs ${genProgress.loaded}/${genProgress.total}…`
                    : "Start Draft"}
                </Text>
              </span>
            </GlassButton>
          </>
        )}
      </div>
    </div>
  );
}
