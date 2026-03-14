// CSS import order is load-bearing — do not reorder
import "@canopy-ds/tokens/reset.css"; // 1. Reset: clears browser defaults
import "@canopy-ds/react/styles"; // 2. DS tokens + component styles (fonts, variables, type-styles)
import "tldraw/tldraw.css"; // 3. tldraw canvas styles
import "./index.css"; // 4. App-level overrides (full-screen fix)

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
