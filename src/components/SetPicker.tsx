import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Text } from "@canopy-ds/react";
import { fetchSetList, type ScryfallSet } from "../utils/scryfall";

type Props = {
  selectedCode: string | null;
  selectedName: string | null;
  onSelect: (code: string, name: string) => void;
};

const wrapStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-2xs)",
};

const triggerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--canopy-ds-spacing-xs)",
  width: "100%",
  padding: "var(--canopy-ds-spacing-xs) var(--canopy-ds-spacing-sm)",
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  color: "var(--canopy-ds-color-text-icon-text-default)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
  cursor: "pointer",
  textAlign: "left",
};

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-2xs)",
  padding: "var(--canopy-ds-spacing-xs)",
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "var(--canopy-ds-spacing-2xs) var(--canopy-ds-spacing-xs)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  color: "var(--canopy-ds-color-text-icon-text-default)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-xs)",
  outline: "none",
  fontSize: 14,
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  maxHeight: 240,
  overflowY: "auto",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--canopy-ds-spacing-xs)",
  padding: "var(--canopy-ds-spacing-2xs) var(--canopy-ds-spacing-xs)",
  background: "transparent",
  color: "var(--canopy-ds-color-text-icon-text-default)",
  border: "none",
  borderRadius: "var(--canopy-ds-radius-xs)",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
};

export function SetPicker({ selectedCode, selectedName, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sets, setSets] = useState<ScryfallSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchSetList()
      .then((list) => {
        if (cancelled) return;
        setSets(list);
        setLoading(false);
        // Default to the most recently released set, but only the first time.
        if (!hasAutoSelectedRef.current && !selectedCode && list.length > 0) {
          hasAutoSelectedRef.current = true;
          onSelect(list[0].code, list[0].name);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load sets");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // selectedCode/onSelect intentionally omitted — we only want to seed once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sets;
    return sets.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [sets, search]);

  return (
    <div style={wrapStyle}>
      <button
        type="button"
        style={triggerStyle}
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose set"
        aria-expanded={open}
        disabled={loading || !!error}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "var(--canopy-ds-spacing-xs)" }}>
          <Icon name="package" size="sm" />
          <Text variant="body-01" as="span">
            {loading
              ? "Loading sets…"
              : error
              ? `Error: ${error}`
              : selectedName
              ? `${selectedName} (${selectedCode?.toUpperCase()})`
              : "Pick a set"}
          </Text>
        </span>
        <Icon name={open ? "chevron-up" : "chevron-down"} size="sm" />
      </button>

      {open && !loading && !error && (
        <div style={panelStyle}>
          <input
            type="text"
            placeholder="Search sets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
            autoFocus
          />
          <div style={listStyle}>
            {filtered.length === 0 ? (
              <Text
                variant="caption-01"
                as="span"
                style={{
                  color: "var(--canopy-ds-color-text-icon-text-subtle)",
                  padding: "var(--canopy-ds-spacing-xs)",
                }}
              >
                No sets match "{search}"
              </Text>
            ) : (
              filtered.map((s) => {
                const isSelected = s.code === selectedCode;
                return (
                  <button
                    key={s.code}
                    type="button"
                    style={{
                      ...itemStyle,
                      background: isSelected
                        ? "var(--canopy-ds-color-interactive-interactive-default)"
                        : "transparent",
                    }}
                    onClick={() => {
                      onSelect(s.code, s.name);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {s.iconSvgUri && (
                      <img
                        src={s.iconSvgUri}
                        alt=""
                        width={16}
                        height={16}
                        style={{ flexShrink: 0, filter: "invert(var(--canopy-ds-set-icon-invert, 0))" }}
                      />
                    )}
                    <Text variant="body-01" as="span" style={{ flex: 1 }}>
                      {s.name}
                    </Text>
                    <Text
                      variant="caption-01"
                      as="span"
                      style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
                    >
                      {s.code.toUpperCase()}
                    </Text>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
