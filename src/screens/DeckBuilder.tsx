import { useEffect, useMemo, useState } from "react";
import { GlassButton, Heading, Icon, Pill, Text } from "@canopy-ds/react";
import {
  useSelf,
  useStorage,
  useUpdateMyPresence,
} from "../liveblocks.config";
import type { ScryfallCard } from "../utils/scryfall";
import {
  BASIC_NAMES,
  type BasicName,
  type DeckProgress,
  computeProgress,
  deckStorageKey,
  emptyBasics,
  parseStoredAllocation,
} from "../utils/deckBuilder";
import { setPendingDeck } from "../stores/pendingDeckStore";

const pageStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "var(--canopy-ds-color-surface-surface-base)",
  display: "grid",
  gridTemplateColumns: "1fr 320px",
  gap: "var(--canopy-ds-spacing-lg)",
  padding: "var(--canopy-ds-spacing-lg)",
  overflow: "hidden",
};

const mainStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-md)",
  overflowY: "auto",
  minWidth: 0,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--canopy-ds-spacing-md)",
  flexWrap: "wrap",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: "var(--canopy-ds-spacing-md)",
  width: "100%",
};

const cardButtonStyle: React.CSSProperties = {
  appearance: "none",
  background: "transparent",
  border: "2px solid transparent",
  borderRadius: "var(--canopy-ds-radius-md)",
  padding: "var(--canopy-ds-spacing-2xs)",
  cursor: "pointer",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-2xs)",
  position: "relative",
  transition:
    "border-color var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-out, ease-out), opacity var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-out, ease-out)",
};

const cardImageStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "200 / 279",
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
  objectFit: "cover",
};

const sidebarStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-md)",
  overflowY: "auto",
  minWidth: 0,
};

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-sm)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-md)",
  padding: "var(--canopy-ds-spacing-md)",
};

const basicRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto auto",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-xs)",
};

const stepperButtonStyle: React.CSSProperties = {
  appearance: "none",
  width: 28,
  height: 28,
  borderRadius: "var(--canopy-ds-radius-sm)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  background: "var(--canopy-ds-color-action-action-default, transparent)",
  color: "var(--canopy-ds-color-text-icon-text-default)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  lineHeight: 1,
};

const progressTrackStyle: React.CSSProperties = {
  width: "100%",
  height: 6,
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  borderRadius: "var(--canopy-ds-radius-round)",
  overflow: "hidden",
};

function cardImageUrl(card: ScryfallCard): string {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? "";
}

function ProgressBar({
  label,
  current,
  target,
}: {
  label: string;
  current: number;
  target: number;
}) {
  const pct = Math.max(0, Math.min(100, (current / target) * 100));
  const met = current >= target;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--canopy-ds-spacing-3xs)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text
          variant="caption-01"
          as="span"
          style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}
        >
          {label}
        </Text>
        <Text
          variant="caption-01"
          as="span"
          style={{
            color: met
              ? "var(--canopy-ds-color-text-icon-text-brand, var(--canopy-ds-color-text-icon-text-default))"
              : "var(--canopy-ds-color-text-icon-text-subtle)",
          }}
        >
          {current}/{target}
        </Text>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        style={progressTrackStyle}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: met
              ? "var(--canopy-ds-color-action-action-brand, var(--canopy-ds-color-text-icon-text-default))"
              : "var(--canopy-ds-color-decoration-decoration-blue, var(--canopy-ds-color-text-icon-text-subtle))",
            transition:
              "width var(--canopy-ds-motion-normal) var(--canopy-ds-motion-ease-out, ease-out)",
          }}
        />
      </div>
    </div>
  );
}

export function DeckBuilder() {
  const self = useSelf();
  const myId = self?.connectionId ?? null;
  const updateMyPresence = useUpdateMyPresence();
  const picks = useStorage((root) => root.draft?.picks ?? null);

  const pool: readonly ScryfallCard[] = useMemo(() => {
    if (myId === null || !picks) return [];
    return picks.get(String(myId)) ?? [];
  }, [picks, myId]);

  const storageKey = useMemo(
    () => (myId === null ? null : deckStorageKey(myId)),
    [myId]
  );

  const [mainIndices, setMainIndices] = useState<Set<number>>(new Set());
  const [basics, setBasics] = useState<Record<BasicName, number>>(emptyBasics);
  const [hydrated, setHydrated] = useState(false);

  // Restore from sessionStorage on mount (per-connection).
  useEffect(() => {
    if (!storageKey) return;
    const stored = parseStoredAllocation(sessionStorage.getItem(storageKey));
    if (stored) {
      setMainIndices(new Set(stored.mainIndices));
      setBasics(stored.basics);
    }
    setHydrated(true);
  }, [storageKey]);

  // Persist on change — but only after hydration so we don't clobber stored
  // state with the initial empty values.
  useEffect(() => {
    if (!storageKey || !hydrated) return;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        mainIndices: [...mainIndices],
        basics,
      })
    );
  }, [storageKey, hydrated, mainIndices, basics]);

  const toggleMain = (idx: number) => {
    setMainIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const adjustBasic = (name: BasicName, delta: number) => {
    setBasics((prev) => ({
      ...prev,
      [name]: Math.max(0, prev[name] + delta),
    }));
  };

  const basicsTotal = useMemo(
    () => BASIC_NAMES.reduce((n, name) => n + basics[name], 0),
    [basics]
  );

  const progress: DeckProgress = useMemo(
    () => computeProgress(pool, mainIndices, basicsTotal),
    [pool, mainIndices, basicsTotal]
  );

  const handleDone = () => {
    const main: ScryfallCard[] = [];
    const side: ScryfallCard[] = [];
    pool.forEach((card, i) => {
      if (mainIndices.has(i)) main.push(card);
      else side.push(card);
    });
    setPendingDeck({ main, side, basics });
    if (storageKey) sessionStorage.removeItem(storageKey);
    updateMyPresence({ screen: "canvas" });
  };

  return (
    <div style={pageStyle}>
      <div style={mainStyle}>
        <div style={headerStyle}>
          <Heading
            level={1}
            variant="display-02"
            style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
          >
            Build your deck
          </Heading>
          <Text
            variant="body-01"
            as="span"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
          >
            {mainIndices.size} of {pool.length} picks in main · click to toggle
          </Text>
        </div>

        {pool.length === 0 ? (
          <Text
            variant="body-01"
            as="p"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
          >
            Loading pool…
          </Text>
        ) : (
          <div style={gridStyle}>
            {pool.map((card, i) => {
              const inMain = mainIndices.has(i);
              const url = cardImageUrl(card);
              return (
                <button
                  key={`${card.id}-${i}`}
                  type="button"
                  onClick={() => toggleMain(i)}
                  aria-label={`${inMain ? "Remove" : "Add"} ${card.name} ${inMain ? "from main" : "to main"}`}
                  aria-pressed={inMain}
                  style={{
                    ...cardButtonStyle,
                    borderColor: inMain
                      ? "var(--canopy-ds-color-border-border-brand, var(--canopy-ds-color-text-icon-text-default))"
                      : "transparent",
                    opacity: inMain ? 1 : 0.6,
                  }}
                >
                  {url ? (
                    <img src={url} alt={card.name} style={cardImageStyle} />
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
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--canopy-ds-spacing-2xs)" }}>
                    <Pill>{inMain ? "Main" : "Side"}</Pill>
                    <Text
                      variant="caption-01"
                      as="span"
                      style={{
                        color: "var(--canopy-ds-color-text-icon-text-default)",
                        textAlign: "center",
                      }}
                    >
                      {card.name}
                    </Text>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <aside style={sidebarStyle} aria-label="Deck progress and basics">
        <section style={panelStyle} aria-label="Deck progress">
          <Heading
            level={2}
            variant="headline-02"
            style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
          >
            Progress
          </Heading>
          <ProgressBar
            label="Lands"
            current={progress.lands.current}
            target={progress.lands.target}
          />
          <ProgressBar
            label="Creatures"
            current={progress.creatures.current}
            target={progress.creatures.target}
          />
          <ProgressBar
            label="Spells"
            current={progress.spells.current}
            target={progress.spells.target}
          />
          <ProgressBar
            label="Total main"
            current={progress.totalMain.current}
            target={progress.totalMain.target}
          />
        </section>

        <section style={panelStyle} aria-label="Basic lands">
          <Heading
            level={2}
            variant="headline-02"
            style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
          >
            Basic lands
          </Heading>
          {BASIC_NAMES.map((name) => (
            <div key={name} style={basicRowStyle}>
              <Text
                variant="body-01"
                as="span"
                style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}
              >
                {name}
              </Text>
              <button
                type="button"
                onClick={() => adjustBasic(name, -1)}
                disabled={basics[name] === 0}
                aria-label={`Remove one ${name}`}
                style={{
                  ...stepperButtonStyle,
                  opacity: basics[name] === 0 ? 0.5 : 1,
                  cursor: basics[name] === 0 ? "default" : "pointer",
                }}
              >
                −
              </button>
              <Text
                variant="body-01"
                as="span"
                style={{
                  minWidth: 24,
                  textAlign: "center",
                  color: "var(--canopy-ds-color-text-icon-text-default)",
                }}
              >
                {basics[name]}
              </Text>
              <button
                type="button"
                onClick={() => adjustBasic(name, 1)}
                aria-label={`Add one ${name}`}
                style={stepperButtonStyle}
              >
                +
              </button>
            </div>
          ))}
        </section>

        <GlassButton size="lg" onClick={handleDone} aria-label="Finish deck and enter the canvas">
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--canopy-ds-spacing-xs)",
              color: "var(--canopy-ds-color-text-icon-text-default)",
            }}
          >
            <Icon name="arrow-right" size="sm" />
            <Text variant="headline-02" as="span">Done</Text>
          </span>
        </GlassButton>
      </aside>
    </div>
  );
}
