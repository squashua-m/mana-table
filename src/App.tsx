import { useMemo } from "react";
import { IconSprite } from "@canopy-ds/react";
import { LiveMap } from "@liveblocks/client";
import { RoomProvider } from "./liveblocks.config";
import { MtgCanvas } from "./components/MtgCanvas";
import type { Presence } from "./liveblocks.config";

const PLAYER_COLORS = [
  "var(--canopy-ds-color-player-player-blue)",
  "var(--canopy-ds-color-player-player-green)",
  "var(--canopy-ds-color-player-player-purple)",
  "var(--canopy-ds-color-player-player-yellow)",
  "var(--canopy-ds-color-player-player-red)",
  "var(--canopy-ds-color-player-player-pink)",
];

function generatePresence(): Presence {
  const id = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  const color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
  return {
    cursor: null,
    color,
    username: `Planeswalker #${id}`,
    selectedShapeIds: [],
    dragging: null,
  };
}

export default function App() {
  // Generate once on mount — stable across re-renders
  const initialPresence = useMemo(() => generatePresence(), []);

  return (
    <>
      {/* IconSprite must be mounted once before any <Icon> renders — per iconography.md */}
      <IconSprite />
      <RoomProvider
        id="mana-table-room-1"
        initialPresence={initialPresence}
        initialStorage={{ shapes: new LiveMap<string, never>(), bindings: new LiveMap<string, never>() }}
      >
        <MtgCanvas />
      </RoomProvider>
    </>
  );
}
