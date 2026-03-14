import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

export type Presence = {
  cursor: { x: number; y: number } | null;
  color: string; // random hex assigned on join e.g. "#f4a261"
  username: string; // e.g. "Planeswalker #4823"
};

// Storage is empty at MVP — tldraw manages its own local state.
// Full board sync (via @liveblocks/yjs) is a future phase.
export type Storage = Record<string, never>;

const client = createClient({
  publicApiKey: import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY as string,
});

export const {
  RoomProvider,
  useMyPresence,
  useOthers,
  useUpdateMyPresence,
} = createRoomContext<Presence, Storage>(client);
