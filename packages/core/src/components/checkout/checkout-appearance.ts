import { cn } from "@wse/core/lib/utils"

/** Checkout step chrome: `dark` matches legacy Krausz-on-dark; `light` uses theme tokens for editorial templates. */
export type CheckoutStepAppearance = "dark" | "light"

export function cxInput(appearance: CheckoutStepAppearance) {
  return appearance === "light"
    ? cn(
        "h-12 w-full min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      )
    : cn(
        "h-12 w-full min-w-0 rounded-none border border-border bg-muted/60 px-3 py-2",
        "text-sm font-bold uppercase tracking-widest text-foreground",
        "placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal",
        "focus-visible:border-primary-foreground/50 focus-visible:ring-1 focus-visible:ring-primary-foreground/40 outline-none"
      )
}

/** Native select — same surface as inputs so it does not render as a floating black slab. */
export function cxSelect(appearance: CheckoutStepAppearance) {
  return cn(cxInput(appearance), "appearance-none cursor-pointer pr-10")
}

export function cxLabel(appearance: CheckoutStepAppearance) {
  return appearance === "light"
    ? "text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
    : "text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]"
}

export function cxSectionHeading(appearance: CheckoutStepAppearance) {
  return appearance === "light"
    ? "text-sm font-semibold uppercase tracking-[0.2em] text-foreground"
    : "text-sm font-black text-white uppercase tracking-[0.2em]"
}

export function cxTypeToggleShell(appearance: CheckoutStepAppearance) {
  return appearance === "light"
    ? "flex w-full max-w-full gap-1 rounded-lg border border-border bg-muted/50 p-1"
    : "flex w-full max-w-full gap-1 rounded-none border border-border bg-muted/40 p-1 sm:w-fit"
}

export function cxTypeToggleBtn(appearance: CheckoutStepAppearance, active: boolean) {
  return cn(
    "min-w-0 flex-1 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-widest transition-all rounded-md sm:flex-none sm:px-4",
    appearance === "light"
      ? active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-background hover:text-foreground"
      : active
        ? "bg-[var(--primary-foreground)] text-[var(--primary)] font-black shadow-sm"
        : "text-muted-foreground hover:text-foreground"
  )
}

export function cxMethodCard(appearance: CheckoutStepAppearance, selected: boolean) {
  return cn(
    "w-full min-w-0 gap-3 border-2 p-4 text-left transition-all duration-300",
    "flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-6",
    "group rounded-lg",
    appearance === "light"
      ? selected
        ? "border-secondary bg-secondary/30 shadow-sm"
        : "border-border bg-card hover:border-primary-foreground/40 hover:bg-muted/30"
      : selected
        ? "bg-white/5 border-primary-foreground/35"
        : "bg-black border-white/5 hover:border-white/10"
  )
}

export function cxMethodTitle(appearance: CheckoutStepAppearance) {
  return appearance === "light"
    ? "font-semibold text-foreground uppercase tracking-widest text-xs mb-1"
    : "font-black text-white uppercase tracking-widest text-xs mb-1"
}

export function cxMethodPrice(appearance: CheckoutStepAppearance) {
  return appearance === "light" ? "font-semibold text-foreground text-lg" : "font-black text-white text-lg"
}

export function cxDivider(appearance: CheckoutStepAppearance) {
  return appearance === "light" ? "border-border" : "border-white/10"
}

export function cxGlsBox(appearance: CheckoutStepAppearance) {
  return appearance === "light"
    ? "h-[420px] rounded-lg border border-border bg-muted/40"
    : "h-[420px] bg-muted/40 border border-border"
}

export function cxTextarea(appearance: CheckoutStepAppearance) {
  return appearance === "light"
    ? cn(
        "w-full resize-none rounded-lg border border-border bg-card p-4 text-sm text-foreground shadow-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      )
    : cn(
        "w-full rounded-none border border-border bg-muted/60 p-4 text-foreground font-medium resize-none",
        "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-foreground/40 transition-all"
      )
}

export function cxSummaryMuted(appearance: CheckoutStepAppearance) {
  return appearance === "light" ? "text-sm text-muted-foreground font-medium space-y-1" : "text-sm text-neutral-300 font-medium space-y-1"
}

export function cxSummaryStrong(appearance: CheckoutStepAppearance) {
  return appearance === "light" ? "font-semibold text-foreground uppercase" : "font-black text-white uppercase"
}
