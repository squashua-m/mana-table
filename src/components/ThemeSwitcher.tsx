/**
 * ThemeSwitcher — dark/light mode toggle.
 *
 * Per theming.md: dark is default (no data-theme attribute).
 * Light mode: set data-theme="light" on <html>.
 * Remove the attribute to return to dark.
 *
 * Per iconography.md: sun icon = switch to light, moon icon = switch to dark.
 * Per components.md: GlassButton size="md" iconOnly for icon-only buttons.
 * Per spacing.md: spacing-lg (24px) for top/right edge offset.
 */
import { useState } from "react";
import { GlassButton, Icon } from "@canopy-ds/react";

export function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(
    // Read initial state from the html element (set to dark by default in index.html)
    document.documentElement.getAttribute("data-theme") !== "light"
  );

  const toggle = () => {
    const html = document.documentElement;
    if (isDark) {
      // Switch to light
      html.setAttribute("data-theme", "light");
    } else {
      // Return to dark (default — remove the attribute)
      html.removeAttribute("data-theme");
    }
    setIsDark(!isDark);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "var(--canopy-ds-spacing-lg)",
        right: "var(--canopy-ds-spacing-lg)",
        zIndex: 500,
        pointerEvents: "all",
      }}
    >
      <GlassButton
        size="md"
        iconOnly
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggle}
      >
        {/* In dark mode show sun (to go light); in light mode show moon (to go dark) */}
        <Icon name={isDark ? "sun" : "moon"} size="sm" />
      </GlassButton>
    </div>
  );
}
