# Cabinova template

Quiet Modernism house catalog for deployment key **`cabinova`**. Ported from the Maison Modulaire reference in `landing-templetes/lovable-project-fcc6396c/`.

## Deployment

```env
DEPLOYMENT_KEY=cabinova
ENABLE_SHOP=true
```

- **`ENABLE_SHOP=true`** — required for `/shop`, `/products`, and product admin.
- Ordering is **inquiry-only** in the UI (no cart/checkout links; PDP uses contact CTAs).

Register in [`deployments.config.json`](../../deployments.config.json); validate with `npm run deployments:validate`.

## Admin surfaces

| URL | Purpose |
| --- | --- |
| `/admin/cms/home` | Homepage blocks (hero, manifesto, models, process, contact) |
| `/admin/cms/shop` | Catalog page copy |
| `/admin/cms/pdp` | Shared PDP defaults (merged with per-product overrides) |
| `/admin/cms/about` | Studio page |
| `/admin/cms/contact` | Contact page + inquiry form labels |
| `/admin/products/[id]/visual-page` | **Per-product** visual PDP (`page:pdp:product:{slug}`) |

## Storefront routes

| Route | Role |
| --- | --- |
| `/` | Landing sections via homepage CMS |
| `/shop` | Full catalog (collections layout) |
| `/products/[slug]` | Model detail (custom layout, inquiry CTA) |
| `/about` | Studio story |
| `/contact` | Contact + `ContactInquiryForm` |

## Motion

Uses CSS reveals from `@/components/motion/css-reveal` (Safari-safe). No `motion`/Framer on the storefront.

## Seed products (English demo)

Create products in `/admin/products` with slugs such as `noir-01`, `littoral`, `alba`, `prairie` and images from `/template-assets/cabinova/`. Customize each PDP under **Vizuális oldal** on the product edit screen.

## Theme

Warm paper / ink / ember tokens in [`theme.ts`](./theme.ts). Typography: Fraunces + Inter + JetBrains Mono via [`lib/fonts.ts`](./lib/fonts.ts).
