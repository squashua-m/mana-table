import { useEffect, useRef } from "react";
import { LiveObject } from "@liveblocks/client";
import type { LsonObject, StorageUpdate } from "@liveblocks/client";
import type { Editor, TLRecord, TLShapeId } from "tldraw";
import { useRoom } from "../liveblocks.config";
import { activeDragShapes, onDragShapeCleaned } from "../stores/dragState";

// Only sync board-state records. Instance, page, camera, document are local UI state.
const SYNCABLE_TYPES = new Set(["shape", "binding"]);

export function useTldrawSync(editor: Editor | null): void {
  const room = useRoom();
  // Guard against double-init in React StrictMode (two mount cycles)
  const initializedRef = useRef(false);
  // Buffer the latest skipped Storage value per shapeId while it's in activeDragShapes.
  // Liveblocks fires each update once — if we skip it, we must apply it on cleanup.
  const pendingShapeUpdates = useRef<Map<string, TLRecord>>(new Map());

  // When a shape's drag-playback window closes, apply any buffered Storage update
  // so the final position is always in sync with the authoritative Storage value.
  useEffect(() => {
    if (!editor) return;
    return onDragShapeCleaned((shapeId) => {
      const pending = pendingShapeUpdates.current.get(shapeId);
      if (pending) {
        editor.store.mergeRemoteChanges(() => {
          editor.store.put([pending]);
        });
        pendingShapeUpdates.current.delete(shapeId);
      }
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    let unsubOutbound: (() => void) | null = null;
    let unsubInbound: (() => void) | null = null;
    let cancelled = false;

    async function setup() {
      // ── Phase 1: Seed tldraw with persisted board state ──────────────────
      const { root } = await room.getStorage();
      if (cancelled) return;

      const shapes = root.get("shapes");
      const bindings = root.get("bindings");

      editor!.store.mergeRemoteChanges(() => {
        for (const [, obj] of shapes) {
          const record = obj.toObject();
          if (record?.id) editor!.store.put([record as unknown as TLRecord]);
        }
        for (const [, obj] of bindings) {
          const record = obj.toObject();
          if (record?.id) editor!.store.put([record as unknown as TLRecord]);
        }
      });

      // ── Phase 2: Outbound — local user changes → Liveblocks ──────────────
      // source: 'user' ensures remote-applied changes are never echoed back
      unsubOutbound = editor!.store.listen(
        ({ changes }) => {
          room.batch(() => {
            for (const record of Object.values(changes.added)) {
              const r = record as TLRecord;
              if (!SYNCABLE_TYPES.has(r.typeName)) continue;
              const liveMap = r.typeName === "shape" ? shapes : bindings;
              liveMap.set(r.id, new LiveObject(r as unknown as LsonObject));
            }

            for (const pair of Object.values(changes.updated)) {
              const r = (pair as [TLRecord, TLRecord])[1];
              if (!SYNCABLE_TYPES.has(r.typeName)) continue;
              const liveMap = r.typeName === "shape" ? shapes : bindings;
              const existing = liveMap.get(r.id);
              if (existing) {
                existing.update(r as unknown as LsonObject);
              } else {
                liveMap.set(r.id, new LiveObject(r as unknown as LsonObject));
              }
            }

            for (const record of Object.values(changes.removed)) {
              const r = record as TLRecord;
              if (!SYNCABLE_TYPES.has(r.typeName)) continue;
              const liveMap = r.typeName === "shape" ? shapes : bindings;
              liveMap.delete(r.id);
            }
          });
        },
        { source: "user" }
      );

      // ── Phase 3: Inbound — remote Liveblocks changes → tldraw ────────────
      // isDeep: true fires StorageUpdate[] for changes to the LiveMap and all
      // nested LiveObjects. mergeRemoteChanges marks ops as source:'remote',
      // which the outbound listener filters out — no feedback loops.
      const handleStorageUpdate = (updates: StorageUpdate[]) => {
        editor!.store.mergeRemoteChanges(() => {
          for (const update of updates) {
            if (update.type === "LiveMap") {
              for (const [key, delta] of Object.entries(update.updates)) {
                if (delta.type === "delete") {
                  editor!.store.remove([key as TLShapeId]);
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const liveObj = (update.node as any).get(key);
                  if (liveObj) {
                    const record = liveObj.toObject();
                    if ((record as any)?.id) {
                      if (activeDragShapes.has(key)) {
                        // Shape is under drag-playback control — buffer the latest Storage
                        // value instead of applying it. Applied on cleanup via onDragShapeCleaned.
                        pendingShapeUpdates.current.set(key, record as unknown as TLRecord);
                      } else {
                        editor!.store.put([record as unknown as TLRecord]);
                      }
                    }
                  }
                }
              }
            } else if (update.type === "LiveObject") {
              const record = update.node.toObject();
              const id = (record as LsonObject)?.id as string | undefined;
              const typeName = (record as LsonObject)?.typeName as string | undefined;
              if (id && typeName && SYNCABLE_TYPES.has(typeName)) {
                if (typeName === "shape" && activeDragShapes.has(id)) {
                  // Shape is under drag-playback control — buffer latest Storage value.
                  pendingShapeUpdates.current.set(id, record as unknown as TLRecord);
                  continue;
                }
                editor!.store.put([record as unknown as TLRecord]);
              }
            }
          }
        });
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unsubShapes = (room.subscribe as any)(shapes, handleStorageUpdate, { isDeep: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unsubBindings = (room.subscribe as any)(bindings, handleStorageUpdate, { isDeep: true });

      unsubInbound = () => {
        unsubShapes();
        unsubBindings();
      };
    }

    setup().catch(console.error);

    return () => {
      cancelled = true;
      unsubOutbound?.();
      unsubInbound?.();
      initializedRef.current = false;
    };
  }, [editor, room]);
}
