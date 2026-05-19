import { useMemo } from "react";
import { IconSprite } from "@canopy-ds/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "./liveblocks.config";
import { AppShell } from "./screens/AppShell";
import { LandingPage } from "./screens/LandingPage";
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

// Drafts are scoped to rooms identified by `?room=<slug>`. Visiting `/`
// with no room param lands on the LandingPage where the user creates a
// new draft (generates a slug) or joins an existing one via code.
function resolveRoomId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("room");
}

export default function App() {
  // Generate once on mount — stable across re-renders
  const initialPresence = useMemo(() => generatePresence(), []);
  const roomId = useMemo(() => resolveRoomId(), []);

  if (!roomId) {
    return (
      <>
        <IconSprite />
        <LandingPage />
      </>
    );
  }

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
