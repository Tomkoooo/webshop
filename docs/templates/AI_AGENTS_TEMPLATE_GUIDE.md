# AI Agent Template Guide

A one-page brief for Cursor, Claude, or any code-generating agent that is asked to create a new Layout Template for this engine.

## What you are building

A `TemplateModule` (typed in [packages/sdk/src/templates/types.ts](../../packages/sdk/src/templates/types.ts)) that controls **`home` / `shop` / `pdp` / static** page shells and shared **chrome** (navbar/footer—including on **`/cart`**, **`/checkout`**, **`/profile`** via `StorefrontFlowShell`). The engine is **Next.js 16 App Router + React 19 + Tailwind v4 + shadcn/ui**. Templates are workspace packages under `packages/templates/<id>/` (published as `@wse/template-<id>`), loaded via `packages/core/src/templates/registry.ts`. There is no runtime template loading.

Read [CREATING_A_TEMPLATE.md](./CREATING_A_TEMPLATE.md) before generating code. This guide is the short brief for the LLM; that doc is the human-readable specification.

For **homepage block CMS** internals (data model, `CmsEditProvider`, inline primitives, rendering caveats), read [HOMEPAGE_BLOCKS_CMS_ARCHITECTURE.md](../cms/HOMEPAGE_BLOCKS_CMS_ARCHITECTURE.md).

To **import customer-provided copy** into CMS/template content, read [AGENT_CONTENT_IMPORT.md](../cms/AGENT_CONTENT_IMPORT.md) (`npm run cms:inspect`, `npm run cms:apply-import`).

For **which deploys may use your template**, read [AI_AGENTS_DEPLOYMENT_GUIDE.md](../deployment/AI_AGENTS_DEPLOYMENT_GUIDE.md). After registering in `src/templates/registry.ts`, add the template id to **`allowedTemplates`** (and optionally **`defaultTemplateId`**) for each row in [`deployments.config.json`](../../deployments.config.json). Admins only see templates allowed for the active `DEPLOYMENT_KEY`; activation is rejected otherwise.

## Full-site branding (mandatory for new registry templates)

A new template is **not** “chrome + one static page.” Operators expect a coherent **layout language** everywhere the engine delegates to the template. Work through this list in order; skipping restyled pages while only editing Navbar, Footer, and `/about` is a failed template.

1. **`chrome/`** — `Navbar.tsx`, `Footer.tsx` (same world as the pages; respect `shopEnabled`, profile/admin affordances, neutral header — see *Registry realities* below).
2. **`pages/home/`** — On **path 1** (`homepage-blocks`): keep **`homepageSnapshotSchema`**, **`cmsPageKind`**, and a real **`HomeRender`** — **do not replace the persisted JSON shape** — but **do** change wrappers, spacing, typography, section rhythm, and token-driven styling so the public home no longer looks like an unmodified copy of the base template’s layout shell. **`/admin/cms/home`** previews **`TEMPLATE_REGISTRY[id].chrome` + `pages.home.Render`** (same as production), not a hardcoded engine layout.
3. **`pages/shop/`** and **`pages/pdp/`** — Implement a distinct **`Render`** (and matching CMS preview) for catalog and product shells; **`/shop`** is the storefront “search/catalog” surface (query + filters), not a separate engine route.
4. **`static-pages/<slug>/`** — Every slug in `manifest.capabilities.staticPages` gets a real layout, not a token edit of one page only.
5. **`flowPages`** — For **`manifest.deployment: "commerce"`**, either use **`flowPageCompose: 'routeOnly'`** + **`RouteMain`** for full-bleed custom UI ([`atelier-showcase`](../../src/templates/atelier-showcase/template.config.ts)), or ship **`Wrapper`** (+ optional **`shell`**, **`Body`**) like [`default-modern`](../../src/templates/default-modern/template.config.ts). Flow shell copy uses **`page:cart`** / **`page:checkout`** / **`page:profile`** when **`shell`** is set; only the homepage is editable under **`/admin/cms`** for most templates.
6. **`theme.ts` / `defaultTheme`** — Curate baseline tokens so resets and previews match the design (optional only when you consciously inherit engine defaults and say so in README).
7. **`commerceSlots.ProductCard`** (optional) — Custom grid card skin on `/shop` for parity between CMS product grids and the catalog.

**Engine boundary:** Routes and APIs stay under **`src/app/cart`**, **`src/app/checkout`**, **`src/app/profile`**. Templates control **presentation** via **`flowPages`** (framed **`Wrapper`/`shell`/`Body`** or **`flowPageCompose: 'routeOnly'`** + **`RouteMain`**) and the [**`@/templates/sdk`**](../../src/templates/sdk/index.ts) hooks (**`useTemplateCartActions`**, **`useCheckoutWizardModel`**, **`useProfileAccountModel`**). Replacing server handlers or Stripe contracts means forking the engine.

## Mandatory: homepage block CMS (registry templates)

When you add a **`TemplateModule`** to `src/templates/registry.ts`, **`pages.home`** **must** use the same **admin** contract as **`default-modern`**:

- `pages.home.schema` **must** be [`homepageSnapshotSchema`](../../src/features/homepage-cms/types/homepage-schema.ts) (re-export pattern: [`default-modern/pages/home/schema.ts`](../../src/templates/default-modern/pages/home/schema.ts)).
- `pages.home` **must** set **`cmsPageKind: "homepage-blocks"`**.
- `HomeRender` **must** render that snapshot — typically [`RealHomepageSections`](../../src/features/homepage-cms/render/RealHomepageSections.tsx) or [`HomepageRenderer`](../../src/features/homepage-cms/render/HomepageRenderer.tsx) — and work inside **`VisualHomepageEditor`** (template chrome + [`CmsEditProvider`](../../src/features/homepage-cms/components/editor/cms-edit-context.tsx)).
- Keep a minimal **`EditorPanel`** for typing; operators use **`/admin/cms/home`** only.

**Never** replace `home` with a bespoke JSON schema unless you fork the entire homepage CMS feature.

### Campaign landing templates (`surface-json` home) — allowed exception

Single-page campaign landings (e.g. **Kerámia Dental** subdomains) may use a **custom JSON schema** on `pages.home` instead of `homepage-blocks`. That is **not** “no CMS” — it uses the **surface JSON visual editor** (click-to-edit on the live page), same machinery as static pages and shop shells.

When you choose this path, **all** of the following are **mandatory**:

1. **`pages.home.Render`** — Wire **every** operator-editable field with [`EditableDocText`](../../src/features/template-cms/primitives/EditableDocText.tsx) / [`EditableDocImage`](../../src/features/template-cms/primitives/EditableDocImage.tsx) / [`EditableDocRichText`](../../src/features/template-cms/primitives/EditableDocRichText.tsx) behind [`useSurfaceDocEdit`](../../src/features/template-cms/surface-doc-edit-context.tsx). Use [`CmsListAddButton`](../../src/features/template-cms/primitives/CmsListItemToolbar.tsx) / [`CmsListItemToolbar`](../../src/features/template-cms/primitives/CmsListItemToolbar.tsx) for list sections. Reference: [`keramia-shared/components/CampaignLanding.tsx`](../../src/templates/keramia-shared/components/CampaignLanding.tsx).
2. **Do not** set `cmsPageKind: "homepage-blocks"` on `pages.home` (omit it → `listEditablePages` reports `editorKind: "surface-json"`).
3. **Admin route** — [`src/app/admin/cms/[pageKey]/page.tsx`](../../src/app/admin/cms/[pageKey]/page.tsx) must handle `page:home` + `surface-json` via [`HomeVisualSurfaceEditor`](../../src/features/template-cms/editors/HomeVisualSurfaceEditor.tsx). **Shipping the Render without this route case causes `/admin/cms/home` → 404** even when inline primitives exist.
4. **Verify** — Open `/admin/cms/home` (or shop-disabled `/admin` redirect) and confirm click-to-edit, draft save, and publish work before declaring the template done.

Persistence uses **`/api/admin/template-content`** with `pageKey: page:home` (same as other surfaces), not legacy homepage draft APIs.

### On-canvas copy (`HomepageRenderer` / section components)

When `HomeRender` uses [`HomepageRenderer`](../../src/features/homepage-cms/render/HomepageRenderer.tsx) or shared sections with inline editing, wire [`useCmsEdit`](../../src/features/homepage-cms/components/editor/cms-edit-context.tsx) and [`EditableTextInline`](../../src/features/homepage-cms/components/primitives/EditableTextInline.tsx) / [`EditableLinkInline`](../../src/features/homepage-cms/components/primitives/EditableLinkInline.tsx) (see [`HeroBlockView`](../../src/features/homepage-cms/blocks/hero/View.tsx)). `updateField` only supports **top-level keys on `block.data`**; nested structures use [`patchBlockData`](../../src/features/homepage-cms/components/editor/cms-edit-context.tsx). The provider targets the **first enabled block of that `type`**.

### Shop, PDP, static pages, flow shells

There is **no** operator-facing CMS for these routes in this repo: [`listEditablePages`](../../src/templates/cms-pages.ts) returns **only** the homepage. Templates still ship **`schema`**, **`defaultContent`**, **`Render`**, and **`EditorPanel`** for shop/PDP/static (and optional **`flowPages.*.shell`**) for **storefront rendering**, defaults, and future tooling — not for **`/admin/cms`**.

## Registry realities (read before copying `minimal-shop` / `vivid-storefront`)

- **ENABLE_SHOP**: When the deploy sets `ENABLE_SHOP=false`, `/shop`, `/products`, `/cart`, `/checkout`, `/profile`, shop commerce APIs, and shop admin routes are unavailable. Pages receive **`shopEnabled`** on chrome from [`getActiveChrome()`](../../src/lib/active-chrome.ts). Template Navbars/Footers should respect `shopEnabled` (hide shop/cart/category links).
- **`manifest.deployment`**: Required (**`landing`** vs **`commerce`**). **`commerce`** stacks may list **`home`/`shop`/`pdp`** in **`restyles`**. **`landing`** forbids **`shop`/`pdp`** there (validated); still document marketing intent (`/admin/templates` badges).
- **`manifest.surfaces`**: Required. Almost always **`DEFAULT_TEMPLATE_SURFACES`** from [`src/templates/types.ts`](../../src/templates/types.ts). Only the **home** surface has an admin CMS entry ([`listEditablePages`](../../src/templates/cms-pages.ts)).
- **`commerceSlots.ProductCard`**: Optional catalogue / homepage product card. Storefront **`/shop`** passes **`resolveCommerceShopRendering(template)`** into **`deps.shopRendering`** (includes **`ProductCard`** and optional **`CategoryPill`**); admin shop preview uses the same helper in [`getShopCmsPreviewDeps`](../../src/features/template-cms/resolve-cms-preview-deps.ts). When the slot is absent, **`ShopRender`** falls back to the engine [`ProductCard`](../../src/components/shop/ProductCard.tsx).
- **`commerceSlots.CategoryPill`**: Optional; when set, included on **`deps.shopRendering.CategoryPill`** for **`/shop`** — use inside your **`pages.shop.Render`** (see **`atelier-showcase`** `AtelierShopFilters`).
- **`commerceSlots.ProductDetail`**: Optional **full PDP body** (gallery, variants, add-to-cart). When absent, templates still use the engine [`ProductDetail`](../../src/components/shop/ProductDetail.tsx) via [`ResolvedTemplateProductDetail`](../../src/components/shop/ResolvedTemplateProductDetail.tsx); **`PdpRender`** supplies editorial bands and **`introPlacement`**.
- **`flowPages.*.RouteMain`**: Replaces the **entire default** cart/checkout/profile **page body** for that route ([`FlowRoutePageClient`](../../src/components/flow-routes/FlowRoutePageClient.tsx)). Compose **`Default*PageView`** from [`@/templates/sdk`](../../src/templates/sdk/index.ts) only when you intentionally reuse engine UI.
- **`flowPageCompose: 'routeOnly'`** (on a **`flowPages`** entry): [`FlowPageTemplateBridge`](../../src/components/layout/FlowPageTemplateBridge.tsx) skips **`Wrapper`**, **`shell`**, and **`Body`** — **`RouteMain`** is full-bleed between Navbar and Footer (like **`pages.home.Render`**). Requires **`RouteMain`**; **forbids** **`Wrapper` / `shell` / `Body`**. See **`atelier-showcase`** `flowPages`.
- **Flow SDK** ([`@/templates/sdk`](../../src/templates/sdk/index.ts)): **`useTemplateCartActions`**, **`useCheckoutWizardModel`** (steps + **`/api/checkout/methods`** + submit / Stripe redirect), **`useProfileAccountModel`** (profile **`GET`/`PUT`/`DELETE`** + newsletter). Build any layout; reuse **`BillingStep`** / **`ShippingStep`** / etc. from **`@/components/checkout/*`** as optional building blocks.
- **`flowPages.profile.RouteChrome`**: Optional **profile chrome only** (aside + main wrapper). **`RouteChrome`** on cart/checkout is invalid ( **`defineTemplate`** rejects it).
- **PDP shell**: **`ProductDetail`** (or the slot) is shared commerce UI; **`PdpRender`** can set **`introPlacement`** (`belowHero` vs `aboveGrid`). PDP footer aligns with **`resolveStorefrontFooterContact`** like **`/shop`**.
- **`default-modern` home**: Uses the visual block editor; admins edit at **`/admin/cms/home`** with persistence via **`/api/admin/template-content`** (`pageKey: page:home`), not legacy draft keys.
- **Navbar**: Ship a profile/account affordance consistent with [`src/components/layout/Navbar.tsx`](../../src/components/layout/Navbar.tsx) so **`/profile`** and **`/admin`** (for authorized users) are reachable when the shop/profile surface is enabled. Thin navbars that only link Shop/About omit this.
- **Flow routes**: **`/cart`**, **`/checkout`**, **`/profile`** use [`StorefrontFlowShell`](../../src/components/layout/StorefrontFlowShell.tsx) + [`FlowPageTemplateBridge`](../../src/components/layout/FlowPageTemplateBridge.tsx). Default compose: **`Wrapper` → `shell` → `Body` →** [`FlowRoutePageClient`](../../src/components/flow-routes/FlowRoutePageClient.tsx). With **`flowPageCompose: 'routeOnly'`**, the bridge renders **only** the client slot (no extra template wrappers). **`profile.RouteChrome`** still wraps nested profile routes in [`profile/layout.tsx`](../../src/app/profile/layout.tsx). **`manifest.capabilities.restyles`** lists CMS pages (`home`, `shop`, `pdp`) only.
- **Shop filters / search**: Either reuse engine [`ShopFilters`](../../src/components/shop/ShopFilters.tsx) with URL query params, or ship a fully custom panel in **`pages.shop.Render`** (**`atelier-showcase`** demonstrates the latter + **`CategoryPill`**). **`vivid-storefront`'s filter button is non-functional** today; **`minimal-shop`** skips filters altogether.
- **Navbar color**: Prefer neutral header chrome (**`background`** / **`surface`** / **`border`**). **`bg-primary` across the whole bar** clashes with vivid brand palettes.
- **Mail/contact homepage**: **`default-modern`** uses the homepage **block CMS** (includes **contact / mail-shaped blocks** via `homepageSnapshotSchema`). **`minimal-shop`** and **`vivid-storefront`** use bespoke home schemas **without** those blocks—not equivalent interchangeably.
- **Newsletter**: Gate footer/home newsletter UI on the engine **`newsletter`** feature flag. **`vivid-storefront`** still shows signup in the footer independently of that flag—a doc’d gap.

## Workflow

1. Run the scaffolder to generate a template package:

   ```bash
   npm run create-template -- --id=<your-id> --base=default-modern [--deployment=commerce|landing]
   ```

   This copies the base template into `packages/templates/<your-id>/`, rewrites `package.json` + manifest, registers a lazy loader in `packages/core/src/templates/registry.ts`, adds the tsconfig path alias, and immediately runs the `validate-template` lint so you see the baseline issue list.

2. Customize the generated files and add `public/template-previews/<your-id>.svg` for manifest screenshots.
3. Add the id to **`allowedTemplates`** in [`deployments.config.json`](../../deployments.config.json) for each customer deployment that should use it, then run `npm run deployments:validate`.
4. **Validation gate (mandatory before declaring done):**

   ```bash
   npm run validate-template -- packages/templates/<your-id>
   npm run test:unit -- templates-contract
   npx tsc --noEmit
   ```

   `validate-template` rejects hardcoded colors (`text-white`, `bg-slate-900`, `bg-[#hex]`, raw palette classes), forbidden token pairings (same token as background and text), pages rendered without CMS primitives, incomplete `defaultTheme`, and theme palettes that fail WCAG contrast rules. Fix every error; do not suppress them.

## Hard rules (lint-enforced; failures fail CI)

Inside `packages/templates/**`:

- ❌ **Do not import** `@wse/core/services/*` (runtime), `@wse/core/models/*` (runtime), `@wse/core/lib/db`, `@wse/core/lib/mongodb`, `@wse/core/lib/admin-auth`, `@wse/core/actions/*`, or app API modules. Type-only imports from services and models are allowed.
- ❌ **Do not access** `process.env`.
- ❌ **Do not register** API routes, server actions, or middleware.
- ❌ **Do not** mutate cart, session, or auth state.
- ❌ **Do not hardcode colors.** `wse validate-template` fails on raw palette classes (`text-neutral-400`, `bg-slate-900`), solid `text-white` / `bg-black`, and arbitrary values (`bg-[#123456]`). Use theme-token utilities only.
- ✅ **Do** receive all data via props. Renders take exactly `{ content, deps }`. Editor panels take exactly `{ content, templateId, pageKey, onSave }`.

## Allowed imports

- `@wse/cms-bridge` — **preferred CMS primitives** (`CmsText`, `CmsRichText`, `CmsImage`, `CmsLink`, `CmsDiv`, `CmsList`); legacy `EditableDoc*` from `@wse/core/features/template-cms/primitives/*` remain valid in existing templates
- `@wse/core/features/homepage-cms/*` when implementing **`homepage-blocks`** home (e.g. `homepageSnapshotSchema`, `RealHomepageSections`) — same pattern as `default-modern`
- `@wse/sdk/templates/types`, `@wse/sdk/theme/*`
- `@wse/core/components/ui/*` (shadcn primitives — Button, Input, Label, Sheet, Card, etc.)
- `@wse/core/components/common/*`, `@wse/core/components/sections/*`, `@wse/core/components/layout/*` (engine UI primitives)
- `@wse/core/lib/utils`, `@wse/core/lib/images`
- `react`, `react-dom`, `next/*`, `framer-motion`, `lucide-react`, `zod`, `clsx`, `tailwind-merge`

## CMS-readiness (what the lint enforces)

- Every visible string and image in a page `Render` must be behind a CMS primitive (`Cms*` from `@wse/cms-bridge` or legacy `EditableDoc*` / inline homepage primitives). Pages rendered without any CMS primitive fail `validate-template`.
- Array content (testimonials, features, gallery items) should use `CmsList` on canvas **and** declare `listFields` on the `PageDefinition` so the structured sidebar list editor (add / reorder / duplicate / delete + item form) appears in `/admin/cms`. See `packages/templates/sakkmed/template.config.ts` for a reference declaration.
- Migrating an existing pure-JSX template? Run `node packages/wse-cli/bin/wse.mjs cmsify packages/templates/<id>` to get a report (or `--write` to wrap literal text/images with `CmsText` automatically), then fix the remaining lint errors by hand.

## Theme tokens you can use

Theme v2 is **semantic roles + rules**, defined in [`@wse/sdk/theme`](../../packages/sdk/src/theme/rules.ts): tokens are grouped by role (Surfaces, Text, Actions, Status), contrast between text/background pairs is validated (WCAG AA), and forbidden pairings (e.g. `bg-primary` with `text-primary` on one element) fail the lint. Typography (heading/body font stacks, sizes, weights) is CMS-editable via [`@wse/sdk/theme/typography`](../../packages/sdk/src/theme/typography.ts) — reference `var(--theme-font-heading)` / `var(--theme-font-body)` through the `font-heading` / `font-sans` utilities instead of hardcoding font families.

`defaultTheme` on the `TemplateModule` is **optional**: export a full `ThemeTokens` object from `theme.ts` when the design has a curated palette; omit `defaultTheme` entirely to fall back to engine defaults (`ThemeService.defaults` in `packages/core/src/services/theme.ts`). The storefront uses **baseline + admin overrides** from `ThemeService.getMergedForTemplate`. **Reset to default & save** on `/admin/theme` clears overrides and reapplies the baseline (template or engine). New templates should ship a complete, contrast-safe `defaultTheme` — `validate-template` checks both completeness and the contrast rules.

**Legacy theme rows:** If Mongo `ThemeSetting` was saved before **`overridesOnly: true`** (a full snapshot), it can mask a new template’s `defaultTheme`. **Activating a different template** clears legacy snapshots automatically; **`ThemeEditor` / `saveFullThemeForTemplate`** always writes **`overridesOnly: true`**. Merchants can still use **Reset** on `/admin/theme` after experiments.

Use Tailwind utilities backed by these tokens (defined in `src/app/globals.css`):

- Color: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `text-secondary-foreground`, `bg-accent`, `text-accent-foreground`, `bg-surface`, `text-surface-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-success`, `bg-warning`, `bg-error`
- Custom dark variant in default-modern: `bg-background-dark`

If you ship `defaultTheme`, cover all token keys (validated by `defineTemplate`). Admins override per-token at `/admin/theme`; reset restores the template baseline when set.

## Required structure

Every template must export `TemplateModule` with:

```ts
{
  manifest: {
    id: "kebab-case-unique",
    name: "Human Readable",
    version: "1.0.0",
    author: "...",
    description: "...",
    screenshots: ["/template-previews/<id>.svg"],
    capabilities: {
      hasBlog: false,        // always false; see fork doc
      staticPages: [...],    // slugs you ship under staticPages
      restyles: ["home", "shop", "pdp"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES, // import from @/templates/types
  },
  defaultTheme: myThemeTokens, // optional — omit to use engine baseline only
  chrome: { Navbar, Footer },
  pages: {
    home: { schema, defaultContent, Render, EditorPanel },
    shop: { schema, defaultContent, Render, EditorPanel },
    pdp:  { schema, defaultContent, Render, EditorPanel },
  },
  staticPages: { /* slug -> PageDefinition */ },
}
```

Wrap with `defineTemplate()` so the manifest is validated at module load.

## Render component contracts

```ts
// pages/home/Render.tsx
import type { RenderProps, HomePageDeps } from "@/templates/types"
import type { HomeContent } from "./schema"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  // deps.products, deps.categories, deps.reviews, deps.company are pre-fetched
  return <main>...</main>
}
```

Same shape for `shop` (`ShopPageDeps`), `pdp` (`PdpPageDeps`), and static pages (`StaticPageDeps`). Renders are server components by default. Make them client components only when they need interactivity that can't live in a child component.

## Editor panel contract

```ts
// pages/home/EditorPanel.tsx
"use client"
import type { EditorProps } from "@/templates/types"

export function HomeEditorPanel({ content, onSave }: EditorProps<HomeContent>) {
  // Build a form, then call await onSave(nextContent)
}
```

`onSave` re-validates against your `schema` and persists. Throw to roll back. Use `sonner`'s `toast` for feedback.

## Schema design

- Always `z.object({ ... })`, not `z.union` or top-level `z.array`.
- Provide `.default(...)` on every field so missing values don't break the editor.
- Include a `meta: { seoTitle, seoDescription }` object on every page that has a publicly-meaningful URL (home, shop, pdp, static pages).
- Static-page slug rules: lowercase, hyphens or `/` only, must not collide with engine paths (`shop`, `products`, `cart`, `checkout`, `admin`, `api`, `auth`, `profile`, `maintenance`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `uploads`).

## Visual quality bar

This is the part LLMs typically get wrong. Imitate the rigor of [src/templates/minimal-shop/pages/home/Render.tsx](../../src/templates/minimal-shop/pages/home/Render.tsx):

- Pick a **type system** (e.g. all serif headlines, all sans body) and keep it consistent across pages.
- Pick a **spacing system** (e.g. always `py-24` for section padding) and keep it consistent.
- Choose specific aspect ratios for hero/product images and reuse them.
- Use `framer-motion` sparingly: subtle hovers and entrance animations, not "jiggle on scroll".
- Make the chrome (Navbar, Footer) instantly recognizable as belonging to the same world as the pages.

## Anti-patterns to avoid

- ❌ **Chrome-only (or chrome + one static page) “templates.”** Shipping a new registry template where only **`Navbar`/`Footer`** (and at most **one** static page like `/about`) differ from the scaffold while **`pages/home`**, **`pages/shop`**, and **`pages/pdp`** `Render` components still look like the **uncustomized base** — that is not acceptable; see *Full-site branding* above.
- ❌ Generic "card grid" layouts that look like every Bootstrap site from 2019. If your template doesn't have a strong point of view, it doesn't belong in the registry.
- ❌ Pulling product/category/review data from anywhere except `deps`.
- ❌ Removing or breaking **`cmsPageKind: "homepage-blocks"`** / **`homepageSnapshotSchema`** on **`pages.home`** for registry templates **without** implementing the full **`surface-json`** visual CMS path (inline `EditableDoc*` + **`HomeVisualSurfaceEditor`** admin route).
- ❌ Treating **`EditorPanel`** on shop/PDP/static as an operator workflow — **`/admin/cms`** does not route there; those panels exist for typing and potential future tools only.
- ❌ Hard-coding colors. Use theme tokens.
- ❌ Multiple `<h1>` elements per page. One per route.
- ❌ Omitting **`/profile`** / **`/admin`** entry from chrome when users expect accounts (mirror shared `Navbar`).
- ❌ Full-width **`bg-primary`** navbar—crushes readability for saturated brand primaries.
- ❌ Decorative **fake filter** buttons on `/shop` that never call **`ShopFilters`** or update URL params.
- ❌ Showing newsletter capture when **`newsletter`** is disabled (`FeatureFlagService` / `/api/feature-flags/newsletter`).

## Definition of done

- [ ] **Home CMS (pick one):**
  - **Block home:** **`cmsPageKind: "homepage-blocks"`**, **`homepageSnapshotSchema`**, and a real **`HomeRender`** (`RealHomepageSections` / `HomepageRenderer` — not an empty scaffold). Confirm **`/admin/cms/home`** block editor (device preview + inline fields + publish).
  - **Campaign / JSON home:** Custom `pages.home` schema + **`CampaignLanding`-style** inline `EditableDoc*` on the Render + **`HomeVisualSurfaceEditor`** wired for `page:home`. Confirm **`/admin/cms/home`** click-to-edit + draft/publish (not 404).
- [ ] `npm run validate-template -- packages/templates/<your-id>` passes with **zero errors** (hardcoded colors, token pairings, CMS wiring, defaultTheme completeness, contrast).
- [ ] `npm run test:unit -- templates-contract` passes (validates manifest, schemas, defaults, slugs, homepage-blocks policy).
- [ ] `npx eslint packages/templates/<your-id>` passes (no restricted imports, no `any`).
- [ ] `npx tsc --noEmit` passes.
- [ ] List-shaped content declares `listFields` so the structured sidebar editor works in `/admin/cms`.
- [ ] You manually previewed the template at `/admin/templates/<your-id>` after adding it to the registry.
- [ ] You manually opened **`/admin/cms/home`** and confirmed the **visual editor** works (block editor *or* surface JSON click-to-edit — see *Definition of done* above).
- [ ] A screenshot exists at `public/template-previews/<your-id>.svg`.
- [ ] The README for the template documents its design intent in 3-5 lines.
- [ ] Chrome exposes account/admin navigation like the canonical [`Navbar`](../../src/components/layout/Navbar.tsx) (unless your fork README documents an intentional deviation).
