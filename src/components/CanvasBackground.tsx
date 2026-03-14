/**
 * Custom tldraw Background component.
 * Uses the canopy-ds surface-base token so the canvas responds to theme switching.
 * Per effects.md: surface-base is the page-level background.
 */
export function CanvasBackground() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--canopy-ds-color-surface-surface-base)",
      }}
    />
  );
}
