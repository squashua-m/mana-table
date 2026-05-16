import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import type { BaseUserMeta, LsonObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { ScryfallCard } from "./utils/scryfall";

export type Presence = {
  cursor: { x: number; y: number } | null;
  color: string; // decoration token CSS var randomly assigned on join
  username: string; // e.g. "Planeswalker #4823"
  selectedShapeIds: string[];
  dragging: { shapeId: string } | null;
  screen: "lobby" | "draft" | "deck-build" | "canvas";
  // True between picking and the next pack being passed. Drives the
  // "waiting on [names]" indicator. Hover/selection intentionally not synced.
  pickedThisRound: boolean;
};

// A single 15-card booster pack as stored in Liveblocks. The full Scryfall
// card JSON is preserved so downstream consumers (deck-builder, canvas
// spawn) don't need to re-fetch.
export type PackLson = {
  id: string;
  round: number;
  cards: ScryfallCard[];
};

// Room-level draft state. Collection fields are stubbed empty so later
// draft-experience slices can fill them without extending the schema.
export type DraftLson = {
  state: "idle" | "drafting" | "playing";
  hostId: number | null;
  setCode: string | null;
  setName: string | null;
  currentRound: number;
  pickNumber: number;
  drafters: LiveList<number>;
  packs: LiveList<LiveObject<PackLson>>;
  seatPacks: LiveMap<string, LiveList<number>>;
  picks: LiveMap<string, LiveList<ScryfallCard>>;
};

export type Storage = {
  shapes: LiveMap<string, LiveObject<LsonObject>>;
  bindings: LiveMap<string, LiveObject<LsonObject>>;
  draft: LiveObject<DraftLson>;
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
  useStorage,
  useMutation,
  useSelf,
} = createRoomContext<Presence, Storage, BaseUserMeta, RoomEvent>(client);
