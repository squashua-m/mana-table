import { createClient, LiveMap, LiveObject } from "@liveblocks/client";
import type { BaseUserMeta, LsonObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

export type Presence = {
  cursor: { x: number; y: number } | null;
  color: string; // decoration token CSS var randomly assigned on join
  username: string; // e.g. "Planeswalker #4823"
  selectedShapeIds: string[];
  dragging: { shapeId: string } | null;
};

export type Storage = {
  shapes: LiveMap<string, LiveObject<LsonObject>>;
  bindings: LiveMap<string, LiveObject<LsonObject>>;
};

// Broadcast event for high-fidelity cursor path batching.
// dt = ms since previous point — encodes actual timing for correct replay speed.
export type CursorBatchEvent = {
  type: "cursor-batch";
  points: Array<{ x: number; y: number; dt: number }>;
};

// Broadcast event for high-fidelity card drag path batching.
// Mirrors cursor-batch: same dt encoding, same 100ms playback delay on receiver.
export type DragBatchEvent = {
  type: "drag-batch";
  shapeId: string;
  points: Array<{ x: number; y: number; dt: number }>;
};

type RoomEvent = CursorBatchEvent | DragBatchEvent;

const client = createClient({
  publicApiKey: import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY as string,
  badgeLocation: "bottom-left",
});

export const {
  RoomProvider,
  useMyPresence,
  useOthers,
  useUpdateMyPresence,
  useRoom,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<Presence, Storage, BaseUserMeta, RoomEvent>(client);
