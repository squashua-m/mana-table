import { GlassButton, Icon } from "@canopy-ds/react";

// Floating top-left button that returns the user to the bare `/` landing
// page (i.e. drops them out of the current draft room). Mirrors the
// ThemeSwitcher positioning so it reads as a sibling chrome control.
export function HomeLink() {
  return (
    <div
      style={{
        position: "fixed",
        top: "var(--canopy-ds-spacing-lg)",
        left: "var(--canopy-ds-spacing-lg)",
        zIndex: 500,
        pointerEvents: "all",
      }}
    >
      <GlassButton
        size="md"
        iconOnly
        aria-label="Leave this room and go home"
        onClick={() => {
          window.location.assign(window.location.pathname);
        }}
      >
        <span style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}>
          <Icon name="home" size="sm" />
        </span>
      </GlassButton>
    </div>
  );
}
