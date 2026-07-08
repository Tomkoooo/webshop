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
