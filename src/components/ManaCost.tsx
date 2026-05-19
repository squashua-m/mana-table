type Props = {
  cost: string;
  symbols: Map<string, string>;
  size?: number;
};

const wrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
  flexShrink: 0,
};

// Renders a Scryfall mana cost string ("{2}{R}{R}") as inline SVG icons,
// looking each `{...}` token up in the symbology map. Falls back to the raw
// token text when an icon isn't available (e.g. new symbols added before the
// session-cached symbology fetch).
export function ManaCost({ cost, symbols, size = 12 }: Props) {
  if (!cost) return null;
  const tokens = cost.match(/\{[^}]+\}/g);
  if (!tokens || tokens.length === 0) return null;

  return (
    <span style={wrapStyle} aria-label={`Mana cost ${cost}`}>
      {tokens.map((token, i) => {
        const uri = symbols.get(token);
        if (!uri) {
          return (
            <span
              key={i}
              style={{
                fontSize: size * 0.85,
                color: "var(--canopy-ds-color-text-icon-text-subtle)",
              }}
            >
              {token}
            </span>
          );
        }
        return (
          <img
            key={i}
            src={uri}
            alt=""
            width={size}
            height={size}
            style={{ display: "inline-block", verticalAlign: "middle" }}
          />
        );
      })}
    </span>
  );
}
