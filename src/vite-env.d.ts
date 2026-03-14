/// <reference types="vite/client" />

declare module "@canopy-ds/react" {
  import type { ComponentProps, FC, ReactNode, Ref } from "react";

  export interface GlassButtonProps {
    size?: "sm" | "md" | "lg";
    iconOnly?: boolean;
    href?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    className?: string;
    "aria-label"?: string;
    children?: ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    ref?: Ref<HTMLButtonElement | HTMLAnchorElement>;
    [key: string]: unknown;
  }

  export const GlassButton: FC<GlassButtonProps>;
  export const Button: FC<Record<string, unknown>>;
  export const Text: FC<Record<string, unknown>>;
  export const Heading: FC<Record<string, unknown>>;
  export const Icon: FC<{ name: string; size?: string; [key: string]: unknown }>;
  export const IconSprite: FC<Record<string, unknown>>;
  export const Pill: FC<Record<string, unknown>>;
  export const PillGroup: FC<Record<string, unknown>>;
  export const Tabs: FC<Record<string, unknown>>;
  export const Tab: FC<Record<string, unknown>>;
  export const Avatar: FC<Record<string, unknown>>;
  export const AvatarStack: FC<Record<string, unknown>>;
  export const Container: FC<Record<string, unknown>>;
  export const Grid: FC<Record<string, unknown>>;
  export const Overlay: FC<Record<string, unknown>>;
  export const Menu: FC<Record<string, unknown>>;
  export const MenuItem: FC<Record<string, unknown>>;
  export const MenuDropdown: FC<Record<string, unknown>>;
  export const Checkbox: FC<Record<string, unknown>>;
  export const Switch: FC<Record<string, unknown>>;
  export const RadioGroup: FC<Record<string, unknown>>;
  export const Radio: FC<Record<string, unknown>>;
  export const SegmentedButtons: FC<Record<string, unknown>>;
  export const Segment: FC<Record<string, unknown>>;
  export const TYPOGRAPHY_VARIANTS: string[];
  export const DEFAULT_HEADING_VARIANT_BY_LEVEL: Record<number, string>;
}
