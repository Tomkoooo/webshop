import type { ComponentType, ReactNode } from "react"
import type { ZodType } from "zod"
import { THEME_TOKEN_KEYS } from "@/lib/theme-token-keys"
import type { ThemeTokens } from "@/services/theme"
import type { FooterSettings } from "@/services/footer-settings"
import type { ProductDetailEditorial } from "@/app/products/[slug]/ProductDetail"
import type { SiteContact, SiteContactEntry } from "@/lib/site-contact"

export type { SiteContact, SiteContactEntry }

export type ProductCardSlotProps = {
  product: unknown
  /** Server-derived shop availability; avoids one client API request per card. */
  shopEnabled?: boolean
}

export type RestyledPage = "home" | "shop" | "pdp"

/** Optional navbar search UI from `template.commerceSlots.NavbarSearch` (falls back to engine LiveSearch). */
export type NavbarSearchSlotProps = {
  className?: string
  placeholder?: string
  inputClassName?: string
}

export type ChromeProps = {
  brandName: string
  logoSrc: string
  /** When false, chrome should omit shop/catalog links (landing-only deploy). */
  shopEnabled?: boolean
  /**
   * True inside visual CMS previews: navbar is in normal document flow (not fixed/sticky), uses live
   * props only, and disables navigation/search/cart UX so the strip reads as non-interactive chrome.
   */
  cmsChromePreview?: boolean
  /** Override engine search UI when the template declares `commerceSlots.NavbarSearch`. */
  NavbarSearch?: ComponentType<NavbarSearchSlotProps>
  /** Short venue label from homepage CMS (minecraft-camp contact / hero badge). */
  venueBadge?: string
  children?: ReactNode
}

export type EditorProps<TContent = unknown> = {
  content: TContent
  templateId: string
  pageKey: string
  onSave?: (next: TContent) => Promise<void> | void
}

/** Homepage featured-product row: lite fields + enough data for {@link commerceSlots}.ProductCard. */
export type HomePageFeaturedProduct = {
  id: string
  name: string
  slug: string
  /** Gross display HUF used by legacy homepage carousel markup. */
  price: number
  image: string
  category: string
  rating: number
  hasVariants: boolean
  requireVariantSelection: boolean
  netPrice: number
  discount: number
  vatPercent?: number
  grossPrice?: number
  limitedPrice?: {
    enabled?: boolean
    limitQuantity?: number
    netPrice?: number
    grossPrice?: number
    reservedCount?: number
    soldCount?: number
    claimedCount?: number
  }
  images: string[]
  stock: number
  variants: Array<{
    id: string
    netPrice: number
    grossPrice?: number
    discount?: number
    stock?: number
    isActive?: boolean
    isDefault?: boolean
    attributes?: Record<string, string>
    images?: string[]
    limitedPrice?: {
      enabled?: boolean
      limitQuantity?: number
      netPrice?: number
      grossPrice?: number
      reservedCount?: number
      soldCount?: number
      claimedCount?: number
    }
  }>
}

export type HomePageDeps = {
  /** Active template id — used client-side to resolve `commerceSlots` (no FCs cross the RSC wire). */
  templateId: string
  reviews: Array<{
    id: string
    name: string
    role: string
    content: string
    rating: number
    avatar: string
  }>
  products: HomePageFeaturedProduct[]
  categories: Array<{
    id: string
    name: string
    description: string
    image: string
    slug: string
  }>
  /** Admin-managed contact channels (e-mails, phone, address). Prefer this in new template code. */
  siteContact: SiteContact
  /** Server-derived shop availability for product card CTAs. */
  shopEnabled: boolean
  company: {
    name: string
    address: string
    phone: string
    email: string
    /** @deprecated Use `siteContact.emails` */
    contactEmails: SiteContactEntry[]
  }
}

export type ShopPageDeps = {
  products: unknown[]
  categories: unknown[]
  total: number
  pages: number
  currentPage: number
  query: {
    q?: string
    category?: string
    discounted?: boolean
    sort?: string
    page?: number
  }
  /**
   * Storefront-only components (not serialized in CMS `depsJson`).
   * Omit in admin preview — `ShopRender` falls back to engine `ProductCard`.
   */
  shopRendering?: {
    ProductCard?: ComponentType<ProductCardSlotProps>
    /** Optional category / filter chip from `commerceSlots.CategoryPill` (see `resolveCommerceShopRendering`). */
    CategoryPill?: ComponentType<{ label: string; active?: boolean; href?: string }>
  }
  /** Server-derived shop availability for product card CTAs. */
  shopEnabled: boolean
}

/** Where optional PDP editorial copy (eyebrow/title/body + highlight cards) sits relative to the product hero. */
export type PdpEditorialPlacement = "aboveGrid" | "belowHero"

export type PdpPageDeps = {
  product: unknown
  selectedVariantId?: string
  shopEnabled?: boolean
  /** Set by the product route for client-side `commerceSlots.ProductDetail` resolution. */
  templateId: string
}

export type StaticPageDeps = {
  branding: { brandName: string; logoNav: string; logoFooter: string }
  contactEmails?: Array<{ id: string; label: string; email: string }>
}

/** Engine-managed commerce / account flows (cart, checkout, profile) — chrome from template; body is app code. */
export type FlowRouteKey = "cart" | "checkout" | "profile"

export type FlowPageBodyProps = {
  children: ReactNode
  route: FlowRouteKey
}

export type FlowPageWrapperProps = {
  children: ReactNode
}

/** Props for optional `flowPages.*.RouteMain` (cart / checkout / profile page bodies). */
export type FlowRouteMainProps = {
  shopEnabled: boolean
  variant?: "page" | "embedded"
}

/**
 * Profile layout chrome (aside + main). Template `flowPages.profile.RouteChrome` replaces the default;
 * must render `children` in the main column.
 */
export type FlowProfileRouteChromeProps = {
  children: ReactNode
  shopEnabled: boolean
}

/** Props for optional `commerceSlots.ProductDetail` (full PDP body). */
export type ProductDetailSlotProps = {
  product: unknown
  initialVariantId?: string
  shopEnabled?: boolean
  editorial?: ProductDetailEditorial
  introPlacement?: PdpEditorialPlacement
  /** When true, buy box appears in the first column on large screens (gallery second). */
  buyColumnFirst?: boolean
}

/** Branding-only deps for persisted flow shells (cart / checkout / profile editorial band). */
export type FlowShellDeps = {
  branding: { brandName: string; logoNav: string; logoFooter: string }
}

/**
 * Optional CMS-backed copy/layout band inside `flowPages.*.Wrapper`, wrapping engine route UI.
 */
export type FlowPageShellDefinition<TContent = unknown> = {
  schema: ZodType<TContent>
  defaultContent: TContent
  Shell: ComponentType<{
    content: TContent
    deps: FlowShellDeps
    children: ReactNode
  }>
  EditorPanel: ComponentType<EditorProps<TContent>>
}

/** How the engine composes flow routes under Navbar/Footer (see `FlowPageTemplateBridge`). */
export type FlowPageComposeMode = "default" | "routeOnly"

export type FlowPageDefinition = {
  /**
   * **`routeOnly`** — skip `Wrapper`, `shell`, and `Body`; render only the layout’s `children`
   * (typically `FlowRoutePageClient` → `RouteMain`). Same creative scope as `pages.home.Render`:
   * full width between chrome and footer. Requires **`RouteMain`**. Incompatible with **`shell`**, **`Body`**, and **`Wrapper`**.
   */
  flowPageCompose?: FlowPageComposeMode
  /** Required unless `flowPageCompose === 'routeOnly'`. */
  Wrapper?: ComponentType<FlowPageWrapperProps>
  /** Persisted as `page:cart` / `page:checkout` / `page:profile` when set. Not used with `routeOnly`. */
  shell?: FlowPageShellDefinition
  /**
   * Optional composition slot around engine route UI (inside Wrapper + Shell if present).
   * Must render `children` or checkout/cart flows will not appear. Not used with `routeOnly`.
   */
  Body?: ComponentType<FlowPageBodyProps>
  /**
   * When set, replaces the default engine page body (`CartPageView`, `CheckoutPageView`, `ProfilePageView`).
   * With **`flowPageCompose: 'routeOnly'`**, this is the **entire** page surface (no extra engine wrappers).
   * Compose default views from `@/templates/sdk` only when you intentionally reuse engine UI.
   */
  RouteMain?: ComponentType<FlowRouteMainProps>
  /**
   * **Profile only:** replaces default aside + main chrome around nested profile routes.
   * Must render `children` inside the main content area.
   */
  RouteChrome?: ComponentType<FlowProfileRouteChromeProps>
}

export type CampPageDeps = Record<string, never>

export type AnyPageDeps =
  | HomePageDeps
  | ShopPageDeps
  | PdpPageDeps
  | StaticPageDeps
  | FlowShellDeps
  | CampPageDeps

export type RenderProps<TContent, TDeps extends AnyPageDeps = AnyPageDeps> = {
  content: TContent
  deps: TDeps
}

export interface PageDefinition<TContent, TDeps extends AnyPageDeps = AnyPageDeps> {
  schema: ZodType<TContent>
  defaultContent: TContent
  Render: ComponentType<RenderProps<TContent, TDeps>>
  EditorPanel: ComponentType<EditorProps<TContent>>
  /**
   * When `cmsPageKind === "homepage-blocks"`, lists which homepage block type keys (`hero`, `about`, …) this template’s
   * home surface uses. Drives CMS section hide/show, inserter filtering, and published snapshot pruning.
   * Omit to derive ordered types from `defaultContent.blocks`.
   */
  allowedBlocks?: readonly string[]
  /**
   * When `"homepage-blocks"`, `/admin/cms/home` uses the block editor; other persisted pages use the JSON surface shells.
   */
  cmsPageKind?: "homepage-blocks"
}

export type StaticPageFieldKind = "text" | "richText" | "image" | "list"

/** CMS / product surface: landing sites vs commerce. */
export type PageCategory = "landing" | "shop"

/**
 * Metadata for each core template-owned route (home, shop grid, PDP shell).
 * `adminSegment` is the `{pageKey}` path under `/admin/cms/[pageKey]`.
 */
export type TemplatePageSurface = {
  category: PageCategory
  adminSegment: "home" | "shop" | "pdp"
}

export type TemplateSurfaces = {
  home: TemplatePageSurface
  shop: TemplatePageSurface
  pdp: TemplatePageSurface
}

export const DEFAULT_TEMPLATE_SURFACES: TemplateSurfaces = {
  home: { category: "landing", adminSegment: "home" },
  shop: { category: "shop", adminSegment: "shop" },
  pdp: { category: "shop", adminSegment: "pdp" },
}

export type TemplateCapabilities = {
  hasBlog: boolean
  staticPages: string[]
  restyles: RestyledPage[]
  /** Optional human labels for `/admin/cms` static page nav (slug → label). */
  staticPageLabels?: Record<string, string>
  /** When true, each product may have scoped visual CMS at `page:pdp:product:{slug}`. */
  perProductPdpCms?: boolean
}

/** Merchant positioning: full commerce vs brochure/landing-only story. Not a deploy guard — `ENABLE_SHOP` still gates APIs. */
export type TemplateDeployment = "landing" | "commerce"

export interface TemplateManifest {
  id: string
  name: string
  version: string
  author: string
  description: string
  screenshots: string[]
  capabilities: TemplateCapabilities
  /** Classifies core pages for CMS navigation and ENABLE_SHOP gating. */
  surfaces: TemplateSurfaces
  /** Landing = marketing-first; must not declare shop/pdp in `restyles`. */
  deployment: TemplateDeployment
}

export interface TemplateModule {
  manifest: TemplateManifest
  /**
   * Recommended packaged palette for this template. Omit to inherit engine defaults;
   * admins can override any token from `/admin/theme`. Persisted resets clear overrides
   * back to this baseline (when set) via ThemeService.
   */
  defaultTheme?: ThemeTokens
  chrome: {
    Navbar: ComponentType<ChromeProps>
    Footer: ComponentType<ChromeProps & {
      email?: string
      contactEmails?: Array<{ id: string; label: string; email: string }>
      phone?: string
      address?: string
      categories?: Array<{ id: string; name: string; slug: string; depth: number }>
      footerSettings?: FooterSettings
      newsletterEnabled?: boolean
      legalLinks?: Array<{ key: string; title: string; href: string }>
      /** Homepage CMS may enable inline footer legal links when the template footer supports it. */
      cmsEditable?: boolean
      onSettingsChange?: (next: FooterSettings) => void | Promise<void>
      /** Camp footer: venue line synced with homepage contact block */
      contactVenueAddress?: string
      onContactVenueChange?: (value: string) => void
      onContactEmailChange?: (value: string) => void
    }>
  }
  // PageDefinition is intentionally typed with `any` at the engine boundary:
  // each template specializes its own content type while the engine resolves
  // them generically. Inside a template the strong types still flow.
  pages: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    home: PageDefinition<any, HomePageDeps>
    shop: PageDefinition<any, ShopPageDeps>
    pdp: PageDefinition<any, PdpPageDeps>
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  staticPages: Record<string, PageDefinition<any, StaticPageDeps>>
  /** Optional camp-booking storefront copy surfaces (jegyvasarlas / foglalas / success). */
  campPages?: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    jegyvasarlas?: PageDefinition<any, CampPageDeps>
    foglalas?: PageDefinition<any, CampPageDeps>
    foglalasSiker?: PageDefinition<any, CampPageDeps>
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
  /**
   * Optional wrappers for `/cart`, `/checkout`, and `/profile` (layouts use `FlowPageTemplateBridge`).
   * Omit for full passthrough; chrome + footer still come from `getActiveChrome()`.
   */
  flowPages?: Partial<Record<FlowRouteKey, FlowPageDefinition>>
  /**
   * Presentational commerce primitives resolved per active template (`resolveCommerceSlots` / shop deps).
   * Keep props narrow so templates skin UI without owning business logic.
   */
  commerceSlots?: {
    ProductCard?: ComponentType<ProductCardSlotProps>
    /** Category/filter chip or pill — optional hook for template-specific shop chroming. */
    CategoryPill?: ComponentType<{ label: string; active?: boolean; href?: string }>
    /** Optional PDP adornment zone (wired when `pages.pdp.Render` adopts it — template-driven). */
    PdpChrome?: ComponentType<{ product: unknown; children?: ReactNode }>
    NavbarSearch?: ComponentType<NavbarSearchSlotProps>
    /**
     * Optional full PDP product UI (gallery, variants, add-to-cart). When omitted, the engine
     * [`ProductDetail`](src/app/products/[slug]/ProductDetail.tsx) is used.
     */
    ProductDetail?: ComponentType<ProductDetailSlotProps>
  }
  editorPanels?: Record<string, ComponentType<EditorProps>>
}

export const RESERVED_STATIC_PAGE_SLUGS = new Set<string>([
  "shop",
  "products",
  "cart",
  "checkout",
  "admin",
  "api",
  "auth",
  "profile",
  "maintenance",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "uploads",
])

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/

export function assertValidStaticPageSlug(slug: string): void {
  if (!slug) throw new Error("Template static-page slug must be non-empty")
  if (slug.startsWith("/")) throw new Error(`Template slug must not start with /: ${slug}`)
  if (slug.includes("..")) throw new Error(`Template slug must not contain '..': ${slug}`)
  if (RESERVED_STATIC_PAGE_SLUGS.has(slug.split("/")[0])) {
    throw new Error(
      `Template slug '${slug}' is reserved by the engine and cannot be used as a static page.`
    )
  }
  if (!SLUG_RE.test(slug)) {
    throw new Error(
      `Template slug '${slug}' must contain only lowercase letters, digits, hyphens, and forward slashes.`
    )
  }
}

const HOMEPAGE_BLOCK_KEYS = new Set([
  "hero",
  "about",
  "videoCarousel",
  "features",
  "productGrid",
  "contact",
  "testimonials",
  "cta",
  "gallery",
  "richText",
  "divider",
])

/** Accepts function components and Next.js `dynamic()` loaders (object with $$typeof). */
function isRenderableComponent(value: unknown): boolean {
  if (typeof value === "function") return true
  if (typeof value === "object" && value !== null && "$$typeof" in value) return true
  return false
}

export function defineTemplate(template: TemplateModule): TemplateModule {
  if (!template.manifest.id) throw new Error("TemplateModule.manifest.id required")
  const { surfaces } = template.manifest
  if (!surfaces) throw new Error(`Template '${template.manifest.id}' must declare manifest.surfaces`)
  if (surfaces.home.category !== "landing") {
    throw new Error(`Template '${template.manifest.id}': surfaces.home.category must be 'landing'`)
  }
  if (surfaces.shop.category !== "shop" || surfaces.pdp.category !== "shop") {
    throw new Error(
      `Template '${template.manifest.id}': surfaces.shop and surfaces.pdp must use category 'shop'`
    )
  }
  for (const key of ["home", "shop", "pdp"] as const) {
    if (surfaces[key].adminSegment !== key) {
      throw new Error(
        `Template '${template.manifest.id}': surfaces.${key}.adminSegment must equal '${key}'`
      )
    }
  }
  for (const slug of template.manifest.capabilities.staticPages) {
    assertValidStaticPageSlug(slug)
    if (!template.staticPages[slug]) {
      throw new Error(
        `Template '${template.manifest.id}' declares static page '${slug}' in manifest but does not define it under staticPages.`
      )
    }
  }
  for (const slug of Object.keys(template.staticPages)) {
    assertValidStaticPageSlug(slug)
  }
  const deployment = template.manifest.deployment
  if (deployment !== "landing" && deployment !== "commerce") {
    throw new Error(
      `Template '${template.manifest.id}': manifest.deployment must be 'landing' or 'commerce'`
    )
  }
  if (deployment === "landing") {
    for (const r of template.manifest.capabilities.restyles) {
      if (r === "shop" || r === "pdp") {
        throw new Error(
          `Template '${template.manifest.id}': deployment 'landing' cannot list '${r}' in capabilities.restyles`
        )
      }
    }
  }
  if (template.commerceSlots?.ProductCard && typeof template.commerceSlots.ProductCard !== "function") {
    throw new Error(
      `Template '${template.manifest.id}': commerceSlots.ProductCard must be a component`
    )
  }
  for (const key of ["CategoryPill", "PdpChrome", "NavbarSearch", "ProductDetail"] as const) {
    const slot = template.commerceSlots?.[key]
    if (slot != null && typeof slot !== "function") {
      throw new Error(`Template '${template.manifest.id}': commerceSlots.${key} must be a component`)
    }
  }
  if (template.defaultTheme) {
    for (const key of THEME_TOKEN_KEYS) {
      const val = template.defaultTheme[key as keyof ThemeTokens]
      if (typeof val !== "string" || !val.startsWith("#")) {
        throw new Error(
          `Template '${template.manifest.id}': defaultTheme.${key} must be a #hex color string`
        )
      }
    }
  }
  const home = template.pages.home
  if (home.cmsPageKind === "homepage-blocks" && home.allowedBlocks && home.allowedBlocks.length > 0) {
    for (const t of home.allowedBlocks) {
      if (!HOMEPAGE_BLOCK_KEYS.has(t)) {
        throw new Error(
          `Template '${template.manifest.id}': pages.home.allowedBlocks contains unknown block type '${t}'`
        )
      }
    }
    const snap = home.defaultContent as { blocks?: Array<{ type: string }> }
    for (const b of snap.blocks || []) {
      if (!home.allowedBlocks.includes(b.type)) {
        throw new Error(
          `Template '${template.manifest.id}': pages.home.defaultContent has block type '${b.type}' not listed in allowedBlocks`
        )
      }
    }
  }
  if (template.flowPages) {
    const allowed: FlowRouteKey[] = ["cart", "checkout", "profile"]
    const allowedSet = new Set<string>(allowed)
    for (const key of Object.keys(template.flowPages)) {
      if (!allowedSet.has(key)) {
        throw new Error(
          `Template '${template.manifest.id}': flowPages has invalid key '${key}' (expected one of: ${allowed.join(", ")})`
        )
      }
      const def = template.flowPages[key as FlowRouteKey]
      if (!def) {
        throw new Error(`Template '${template.manifest.id}': flowPages.${key} is empty`)
      }
      const routeOnly = def.flowPageCompose === "routeOnly"
      if (routeOnly) {
        if (def.shell) {
          throw new Error(
            `Template '${template.manifest.id}': flowPages.${key} cannot use shell with flowPageCompose: 'routeOnly'`
          )
        }
        if (def.Body) {
          throw new Error(
            `Template '${template.manifest.id}': flowPages.${key} cannot use Body with flowPageCompose: 'routeOnly'`
          )
        }
        if (def.Wrapper) {
          throw new Error(
            `Template '${template.manifest.id}': flowPages.${key} cannot use Wrapper with flowPageCompose: 'routeOnly'`
          )
        }
        if (!def.RouteMain || typeof def.RouteMain !== "function") {
          throw new Error(
            `Template '${template.manifest.id}': flowPages.${key} with flowPageCompose: 'routeOnly' must define RouteMain`
          )
        }
      } else {
        if (!def.Wrapper || typeof def.Wrapper !== "function") {
          throw new Error(
            `Template '${template.manifest.id}': flowPages.${key} must define a Wrapper component (or set flowPageCompose: 'routeOnly' with RouteMain)`
          )
        }
        if (def.Body && typeof def.Body !== "function") {
          throw new Error(`Template '${template.manifest.id}': flowPages.${key}.Body must be a component`)
        }
        if (def.RouteMain && typeof def.RouteMain !== "function") {
          throw new Error(`Template '${template.manifest.id}': flowPages.${key}.RouteMain must be a component`)
        }
      }
      if (def.RouteChrome) {
        if (key !== "profile") {
          throw new Error(
            `Template '${template.manifest.id}': flowPages.${key}.RouteChrome is only supported for 'profile'`
          )
        }
        if (typeof def.RouteChrome !== "function") {
          throw new Error(`Template '${template.manifest.id}': flowPages.profile.RouteChrome must be a component`)
        }
      }
      if (def.shell) {
        const sh = def.shell
        if (typeof sh.schema?.safeParse !== "function") {
          throw new Error(`Template '${template.manifest.id}': flowPages.${key}.shell.schema required`)
        }
        const parsed = sh.schema.safeParse(sh.defaultContent)
        if (!parsed.success) {
          throw new Error(
            `Template '${template.manifest.id}': flowPages.${key}.shell.defaultContent fails schema`
          )
        }
        if (!isRenderableComponent(sh.Shell) || !isRenderableComponent(sh.EditorPanel)) {
          throw new Error(
            `Template '${template.manifest.id}': flowPages.${key}.shell must define Shell and EditorPanel`
          )
        }
      }
    }
  }
  return template
}
