import type { ThemeTokens } from "@wse/core/services/theme"

/** Same CSS variables as `src/app/layout.tsx` for storefront parity in CMS previews. */
export function themeTokensToCssVars(theme: ThemeTokens): Record<string, string> {
  return {
    "--theme-primary": theme.primary,
    "--theme-primary-foreground": theme.primaryForeground,
    "--theme-secondary": theme.secondary,
    "--theme-secondary-foreground": theme.secondaryForeground,
    "--theme-accent": theme.accent,
    "--theme-accent-foreground": theme.accentForeground,
    "--theme-background": theme.background,
    "--theme-foreground": theme.foreground,
    "--theme-surface": theme.surface,
    "--theme-surface-foreground": theme.surfaceForeground,
    "--theme-border": theme.border,
    "--theme-muted": theme.muted,
    "--theme-muted-foreground": theme.mutedForeground,
    "--theme-success": theme.success,
    "--theme-success-foreground": theme.successForeground,
    "--theme-warning": theme.warning,
    "--theme-warning-foreground": theme.warningForeground,
    "--theme-error": theme.error,
    "--theme-error-foreground": theme.errorForeground,
  }
}

/**
 * Full token bridge for `.admin-storefront-preview` islands inside `.admin-shell`.
 * Re-applies storefront semantics so Tailwind utilities (`bg-primary`, `text-foreground`, …)
 * match the active template instead of the operator admin palette.
 */
export function themeTokensToPreviewCssVars(theme: ThemeTokens): Record<string, string> {
  const themeVars = themeTokensToCssVars(theme)
  return {
    ...themeVars,
    "--background": theme.background,
    "--foreground": theme.foreground,
    "--primary": theme.primary,
    "--primary-foreground": theme.primaryForeground,
    "--secondary": theme.secondary,
    "--secondary-foreground": theme.secondaryForeground,
    "--accent": theme.accent,
    "--accent-foreground": theme.accentForeground,
    "--card": theme.surface,
    "--card-foreground": theme.surfaceForeground,
    "--popover": theme.surface,
    "--popover-foreground": theme.surfaceForeground,
    "--muted": theme.muted,
    "--muted-foreground": theme.mutedForeground,
    "--border": theme.border,
    "--input": theme.muted,
    "--color-background": theme.background,
    "--color-foreground": theme.foreground,
    "--color-primary": theme.primary,
    "--color-primary-foreground": theme.primaryForeground,
    "--color-secondary": theme.secondary,
    "--color-secondary-foreground": theme.secondaryForeground,
    "--color-accent": theme.accent,
    "--color-accent-foreground": theme.accentForeground,
    "--color-surface": theme.surface,
    "--color-surface-foreground": theme.surfaceForeground,
    "--color-border": theme.border,
    "--color-muted": theme.muted,
    "--color-muted-foreground": theme.mutedForeground,
    "--color-popover": theme.surface,
    "--color-popover-foreground": theme.surfaceForeground,
    "--color-destructive": theme.error,
    "--color-destructive-foreground": theme.errorForeground,
    "--color-success": theme.success,
    "--color-success-foreground": theme.successForeground,
    "--color-warning": theme.warning,
    "--color-warning-foreground": theme.warningForeground,
    "--color-error": theme.error,
    "--color-error-foreground": theme.errorForeground,
    color: theme.foreground,
    backgroundColor: theme.background,
  }
}
