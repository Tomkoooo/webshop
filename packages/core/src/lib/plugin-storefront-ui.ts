/**
 * Template-aware typography and layout classes for plugin storefront pages.
 * Reuse engine chrome (Navbar/Footer) + these surfaces instead of bespoke mini-app shells.
 */
export type PluginStorefrontSurface = {
  pageMain: string
  contentShell: string
  heroTitle: string
  sectionTitle: string
  eyebrow: string
  gateTitle: string
  gateButton: string
  highlightCard: string
  sectionSpacing: string
  prose: string
  cmsBanner: string
  cmsBlockChrome: string
}

const DEFAULT_MODERN_SURFACE: PluginStorefrontSurface = {
  pageMain:
    "min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground",
  contentShell: "container mx-auto max-w-4xl px-4 sm:px-6",
  heroTitle: "text-4xl font-black uppercase tracking-tight md:text-5xl",
  sectionTitle: "text-2xl font-black uppercase tracking-tight md:text-3xl",
  eyebrow: "text-xs font-bold uppercase tracking-widest text-muted-foreground",
  gateTitle: "text-2xl font-black uppercase tracking-[0.2em]",
  gateButton: "h-14 w-full rounded-none font-black uppercase tracking-widest text-xs",
  highlightCard: "border border-white/10 bg-white/5 p-6 space-y-2",
  sectionSpacing: "space-y-16",
  prose:
    "prose prose-neutral max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary-foreground",
  cmsBanner: "border border-dashed border-border bg-muted/40 p-3 rounded-lg",
  cmsBlockChrome: "mb-3 flex flex-wrap items-center gap-2 border-b border-border pb-2",
}

const ATELIER_SURFACE: PluginStorefrontSurface = {
  pageMain: "min-h-screen bg-background text-foreground",
  contentShell: "container mx-auto max-w-4xl px-4 sm:px-6",
  heroTitle: "font-serif text-4xl font-semibold tracking-tight md:text-5xl",
  sectionTitle: "font-serif text-2xl font-semibold md:text-3xl",
  eyebrow: "text-xs uppercase tracking-widest text-muted-foreground",
  gateTitle: "font-serif text-3xl font-semibold tracking-tight",
  gateButton: "h-12 w-full rounded-full font-serif",
  highlightCard:
    "rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm backdrop-blur-sm space-y-2",
  sectionSpacing: "space-y-20",
  prose:
    "prose prose-neutral max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary-foreground",
  cmsBanner: "border border-dashed border-border bg-muted/40 p-3 rounded-lg",
  cmsBlockChrome: "mb-3 flex flex-wrap items-center gap-2 border-b border-border pb-2",
}

const MINECRAFT_SURFACE: PluginStorefrontSurface = {
  ...DEFAULT_MODERN_SURFACE,
  pageMain: "min-h-screen minecraft-page-mineshow text-[#2d2817]",
  heroTitle: "font-minecraft text-sm md:text-base",
  sectionTitle: "font-minecraft text-sm",
  gateTitle: "font-minecraft text-sm",
  gateButton: "minecraft-btn w-full",
  highlightCard: "minecraft-panel p-4 space-y-2",
}

export function getPluginStorefrontSurface(templateId: string): PluginStorefrontSurface {
  if (templateId === "atelier-showcase") return ATELIER_SURFACE
  if (templateId === "minecraft-camp") return MINECRAFT_SURFACE
  return DEFAULT_MODERN_SURFACE
}
