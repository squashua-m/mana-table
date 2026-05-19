import { useCallback, useState } from "react";
import { Text } from "@canopy-ds/react";
import type { ScryfallCard } from "../utils/scryfall";

// Large floating card preview shown on hover. Computes a fixed-viewport
// position from the hovered element's rect that stays fully on-screen:
// prefers the right side, flips to the left if it would overflow, and
// clamps both axes. `pointer-events: none` so the preview can't steal
// hover from the underlying element.

const PREVIEW_WIDTH = 320;
// 200×279 is Scryfall's `normal` image aspect.
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * 279) / 200);
const PREVIEW_GAP = 16;
const VIEWPORT_PADDING = 8;

export type PreviewHover = {
  card: ScryfallCard;
  pos: { x: number; y: number };
};

function cardImageUrl(card: ScryfallCard): string {
  return (
    card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? ""
  );
}

function computePreviewPosition(rect: DOMRect): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = rect.right + PREVIEW_GAP;
  if (x + PREVIEW_WIDTH > vw - VIEWPORT_PADDING) {
    const leftCandidate = rect.left - PREVIEW_GAP - PREVIEW_WIDTH;
    x =
      leftCandidate >= VIEWPORT_PADDING
        ? leftCandidate
        : Math.max(VIEWPORT_PADDING, vw - PREVIEW_WIDTH - VIEWPORT_PADDING);
  }

  let y = rect.top;
  if (y + PREVIEW_HEIGHT > vh - VIEWPORT_PADDING) {
    y = vh - PREVIEW_HEIGHT - VIEWPORT_PADDING;
  }
  if (y < VIEWPORT_PADDING) y = VIEWPORT_PADDING;

  return { x, y };
}

export function useCardPreview() {
  const [hovered, setHovered] = useState<PreviewHover | null>(null);

  const show = useCallback(
    (e: React.SyntheticEvent<HTMLElement>, card: ScryfallCard) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHovered({ card, pos: computePreviewPosition(rect) });
    },
    []
  );

  const hide = useCallback((card: ScryfallCard) => {
    setHovered((prev) => (prev && prev.card.id === card.id ? null : prev));
  }, []);

  return { hovered, show, hide };
}

const previewWrapStyle: React.CSSProperties = {
  position: "fixed",
  width: PREVIEW_WIDTH,
  height: PREVIEW_HEIGHT,
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-md)",
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 700,
  boxShadow:
    "var(--canopy-ds-elevation-2-a-offset-x) var(--canopy-ds-elevation-2-a-offset-y) var(--canopy-ds-elevation-2-a-blur) var(--canopy-ds-elevation-2-a-spread) var(--canopy-ds-elevation-2-a-color)," +
    " var(--canopy-ds-elevation-2-b-offset-x) var(--canopy-ds-elevation-2-b-offset-y) var(--canopy-ds-elevation-2-b-blur) var(--canopy-ds-elevation-2-b-spread) var(--canopy-ds-elevation-2-b-color)",
};

const previewImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

export function CardPreviewOverlay({
  hovered,
}: {
  hovered: PreviewHover | null;
}) {
  if (!hovered) return null;
  const url = cardImageUrl(hovered.card);
  return (
    <div
      style={{ ...previewWrapStyle, left: hovered.pos.x, top: hovered.pos.y }}
      aria-hidden
    >
      {url ? (
        <img src={url} alt="" style={previewImageStyle} />
      ) : (
        <div
          style={{
            ...previewImageStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--canopy-ds-spacing-md)",
            textAlign: "center",
          }}
        >
          <Text
            variant="body-01"
            as="span"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
          >
            {hovered.card.name}
          </Text>
        </div>
      )}
    </div>
  );
}
