import { GlassButton, Heading, Icon, Text } from "@canopy-ds/react";
import { useMyPresence, useOthers, useUpdateMyPresence } from "../liveblocks.config";
import type { Presence } from "../liveblocks.config";

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

function PlayerRow({ color, username, isSelf }: { color: string; username: string; isSelf: boolean }) {
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
    </div>
  );
}

export function Lobby() {
  const [myPresence] = useMyPresence();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  const playerCount = others.length + 1;

  const handleJoin = () => {
    updateMyPresence({ screen: "canvas" } as Partial<Presence>);
  };

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
            {playerCount === 1 ? "1 player in the room" : `${playerCount} players in the room`}
          </Text>
        </div>

        <div style={rosterStyle}>
          <PlayerRow color={myPresence.color} username={myPresence.username} isSelf />
          {others.map((other) => (
            <PlayerRow
              key={other.connectionId}
              color={other.presence.color}
              username={other.presence.username}
              isSelf={false}
            />
          ))}
        </div>

        <GlassButton size="lg" onClick={handleJoin} aria-label="Join the table">
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--canopy-ds-spacing-xs)",
              color: "var(--canopy-ds-color-text-icon-text-default)",
            }}
          >
            <Icon name="arrow-right" size="sm" />
            <Text variant="headline-02" as="span">Join Table</Text>
          </span>
        </GlassButton>
      </div>
    </div>
  );
}
