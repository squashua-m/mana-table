/** Tracks whether a canvas card drag is in progress. */

let _isDraggingCanvas = false;
const subs = new Set<(v: boolean) => void>();

export function setCanvasDragging(v: boolean): void {
  if (_isDraggingCanvas === v) return;
  _isDraggingCanvas = v;
  for (const cb of subs) cb(v);
}

export function isCanvasDragging(): boolean {
  return _isDraggingCanvas;
}

export function subscribeCanvasDrag(cb: (v: boolean) => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}
