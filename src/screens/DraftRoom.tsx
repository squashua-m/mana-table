import { Heading, Text } from "@canopy-ds/react";
import { useSelf, useStorage } from "../liveblocks.config";
import type { ScryfallCard } from "../utils/scryfall";

const pageStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "var(--canopy-ds-color-surface-surface-base)",
  display: "flex",
  flexDirection: "column",
  padding: "var(--canopy-ds-spacing-lg)",
  gap: "var(--canopy-ds-spacing-lg)",
  overflowY: "auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--canopy-ds-spacing-md)",
  flexWrap: "wrap",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "var(--canopy-ds-spacing-md)",
  width: "100%",
  maxWidth: 1400,
  marginLeft: "auto",
  marginRight: "auto",
};

const cardWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-2xs)",
};

const cardImageStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "200 / 279",
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
  objectFit: "cover",
};

function cardImageUrl(card: ScryfallCard): string {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? "";
}

export function DraftRoom() {
  const self = useSelf();
  const myId = self?.connectionId ?? null;

  const setName = useStorage((root) => root.draft?.setName ?? null);
  const currentRound = useStorage((root) => root.draft?.currentRound ?? 1);
  const pickNumber = useStorage((root) => root.draft?.pickNumber ?? 1);
  const drafters = useStorage((root) => root.draft?.drafters ?? null);
  const packs = useStorage((root) => root.draft?.packs ?? null);
  const seatPacks = useStorage((root) => root.draft?.seatPacks ?? null);

  const myPack = (() => {
    if (myId === null || !drafters || !packs || !seatPacks) return null;
    const myHeldIndices = seatPacks.get(String(myId));
    if (!myHeldIndices || myHeldIndices.length === 0) return null;
    const currentPackIdx = myHeldIndices[0];
    return packs[currentPackIdx] ?? null;
  })();

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <Heading
          level={1}
          variant="display-02"
          style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
        >
          Pack {currentRound}/3
        </Heading>
        <Text
          variant="headline-02"
          as="span"
          style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
        >
          Pick {pickNumber}/15
        </Text>
        {setName && (
          <Text
            variant="body-01"
            as="span"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
          >
            · {setName}
          </Text>
        )}
      </div>

      {myPack ? (
        <div style={gridStyle}>
          {myPack.cards.map((card, i) => (
            <div key={`${card.id}-${i}`} style={cardWrapStyle}>
              {cardImageUrl(card) ? (
                <img src={cardImageUrl(card)} alt={card.name} style={cardImageStyle} />
              ) : (
                <div
                  style={{
                    ...cardImageStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "var(--canopy-ds-spacing-xs)",
                    textAlign: "center",
                  }}
                >
                  <Text
                    variant="caption-01"
                    as="span"
                    style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
                  >
                    {card.name}
                  </Text>
                </div>
              )}
              <Text
                variant="caption-01"
                as="span"
                style={{ color: "var(--canopy-ds-color-text-icon-text-default)", textAlign: "center" }}
              >
                {card.name}
              </Text>
            </div>
          ))}
        </div>
      ) : (
        <Text
          variant="body-01"
          as="p"
          style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
        >
          Waiting for a pack…
        </Text>
      )}
    </div>
  );
}
