import { GlassButton, Heading, Icon, Text } from "@canopy-ds/react";
import {
  useMutation,
  useMyPresence,
  useOthers,
  useSelf,
  useStorage,
} from "../liveblocks.config";

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

const rosterRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-xs)",
  padding: "var(--canopy-ds-spacing-2xs) var(--canopy-ds-spacing-xs)",
};

function PlayerRow({
  color,
  username,
  isSelf,
  isHost,
}: {
  color: string;
  username: string;
  isSelf: boolean;
  isHost: boolean;
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
    </div>
  );
}

export function Lobby() {
  const [myPresence] = useMyPresence();
  const others = useOthers();
  const self = useSelf();

  const draftState = useStorage((root) => root.draft?.state ?? "idle");
  const hostId = useStorage((root) => root.draft?.hostId ?? null);

  const playerCount = others.length + 1;
  const myConnectionId = self?.connectionId ?? null;
  const isHost = hostId !== null && hostId === myConnectionId;

  const startNewDraft = useMutation(({ storage, self }) => {
    const draft = storage.get("draft");
    if (draft.get("state") !== "idle") return;
    draft.update({
      state: "drafting",
      hostId: self.connectionId,
    });
  }, []);

  const startDraft = useMutation(({ storage, self }) => {
    const draft = storage.get("draft");
    if (draft.get("state") !== "drafting") return;
    if (draft.get("hostId") !== self.connectionId) return;
    draft.update({
      state: "playing",
      hostId: null,
    });
  }, []);

  const subtitle = (() => {
    if (draftState === "drafting" && isHost) return "You're the host. Start when ready.";
    if (draftState === "drafting") return "Host is setting up the draft…";
    return playerCount === 1 ? "1 player in the room" : `${playerCount} players in the room`;
  })();

  return (
    <div style={pageStyle}>
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

        <div style={rosterStyle}>
          <PlayerRow
            color={myPresence.color}
            username={myPresence.username}
            isSelf
            isHost={isHost}
          />
          {others.map((other) => (
            <PlayerRow
              key={other.connectionId}
              color={other.presence.color}
              username={other.presence.username}
              isSelf={false}
              isHost={hostId !== null && hostId === other.connectionId}
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
          <GlassButton size="lg" onClick={() => startDraft()} aria-label="Start the draft">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--canopy-ds-spacing-xs)",
                color: "var(--canopy-ds-color-text-icon-text-default)",
              }}
            >
              <Icon name="arrow-right" size="sm" />
              <Text variant="headline-02" as="span">Start Draft</Text>
            </span>
          </GlassButton>
        )}
      </div>
    </div>
  );
}
