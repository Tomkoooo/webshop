import type { ThemeTokens } from "@wse/core/services/theme"

/**
 * Nagyarcu brand yellow. The logo is a very bright yellow (~#FFEA00), but the
 * original site theme used a slightly warmer / less-green golden yellow for text
 * and accents so it stays readable on the dark UI. Tweak this one constant to
 * shift every yellow accent (hero highlight, icons, primary button label).
 */
export const NAGYARCU_YELLOW = "#FFD400"

/** Secondary brand color: warm orange. */
export const NAGYARCU_ORANGE = "#FF7A1A"

/**
 * IMPORTANT — token mapping for the `default-modern` template.
 *
 * This template paints its brand accent (the hero highlight word, feature icons,
 * link/CTA text) with `text-primary-foreground`, and primary buttons are
 * `bg-primary text-primary-foreground`. So to get "yellow brand on dark buttons"
 * the tokens must be:
 *
 *   primary            = dark   -> primary BUTTON BACKGROUND (dark chip)
 *   primaryForeground  = yellow -> brand ACCENT + primary button LABEL (readable on dark)
 *   secondary          = orange -> secondary / hover fills
 *
 * This is why setting `primary` to yellow made buttons unreadable and did not
 * change the accent color — the accent lives in `primaryForeground`.
 */
export const nagyarcuThemeColors: ThemeTokens = {
  primary: "#1A1A1A",
  primaryForeground: NAGYARCU_YELLOW,
  secondary: NAGYARCU_ORANGE,
  secondaryForeground: "#160C00",
  accent: NAGYARCU_YELLOW,
  accentForeground: "#141414",
  background: "#0A0A0A",
  foreground: "#F5F5F5",
  surface: "#141414",
  surfaceForeground: "#F5F5F5",
  border: "#2A2A2A",
  muted: "#171717",
  mutedForeground: "#A3A3A3",
  success: "#16A34A",
  successForeground: "#FFFFFF",
  warning: "#D97706",
  warningForeground: "#FFFFFF",
  error: "#DC2626",
  errorForeground: "#FFFFFF",
}

export const nagyarcuThemePaletteDoc = {
  name: "Én, a nagyarcú",
  brandYellow: {
    label: "Brand yellow (primaryForeground)",
    hex: NAGYARCU_YELLOW,
    usage: "Hero highlight word, icons, primary button label, link accents",
  },
  orange: {
    label: "Orange (secondary)",
    hex: NAGYARCU_ORANGE,
    usage: "Secondary buttons, hover fills",
  },
  primaryButtonBg: {
    label: "Primary button background (primary)",
    hex: "#1A1A1A",
    usage: "Dark chip behind the yellow button label",
  },
  background: { label: "Near-black", hex: "#0A0A0A" },
  foreground: { label: "Off-white", hex: "#F5F5F5" },
  surface: { label: "Card charcoal", hex: "#141414" },
} as const
