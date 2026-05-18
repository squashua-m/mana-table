import { useMemo } from "react";
import { IconSprite } from "@canopy-ds/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "./liveblocks.config";
import { AppShell } from "./screens/AppShell";
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
    screen: "lobby",
    pickedThisRound: false,
  };
}

// Optional ?room=... query param lets E2E tests (and quick experiments)
// isolate state to a fresh Liveblocks room.
function resolveRoomId(): string {
  if (typeof window === "undefined") return "mana-table-room-1";
  return (
    new URLSearchParams(window.location.search).get("room") ??
    "mana-table-room-1"
  );
}

export default function App() {
  // Generate once on mount — stable across re-renders
  const initialPresence = useMemo(() => generatePresence(), []);
  const roomId = useMemo(() => resolveRoomId(), []);

  return (
    <>
      {/* IconSprite must be mounted once before any <Icon> renders — per iconography.md */}
      <IconSprite />
      <RoomProvider
        id={roomId}
        initialPresence={initialPresence}
        initialStorage={{
          shapes: new LiveMap<string, never>(),
          bindings: new LiveMap<string, never>(),
          draft: new LiveObject({
            state: "idle",
            hostId: null,
            setCode: null,
            setName: null,
            currentRound: 0,
            pickNumber: 0,
            drafters: new LiveList<number>([]),
            packs: new LiveList([]),
            seatPacks: new LiveMap(),
            picks: new LiveMap(),
          }),
        }}
      >
        <AppShell />
      </RoomProvider>
    </>
  );
}
