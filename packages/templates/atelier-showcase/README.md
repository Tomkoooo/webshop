# Atelier Showcase

Demonstration layout template for the webshop engine: warm paper-like `defaultTheme`, serif-forward chrome, `HomepageRenderer` (all homepage block types), a **fully custom** catalogue on **`/shop`** (atelier cards + **`AtelierShopFilters`** + **`commerceSlots.CategoryPill`**), **`flowPageCompose: 'routeOnly'`** on **`/cart`**, **`/checkout`**, **`/profile`** so **`RouteMain`** is **full-bleed** (no engine `Wrapper`/`shell`/`Body` shrinking the page), **custom cart** (`useTemplateCartActions`), **custom checkout** built on **`useCheckoutWizardModel`** (same Stripe/COD logic, different layout), **custom profile tab** via **`useProfileAccountModel`**, **`profile.RouteChrome`**, **`commerceSlots.ProductDetail`**, and two CMS static routes:

- **`/editorial`** — long-form sections with optional images; rich text uses the surface CMS (upload via admin → paste `/uploads/…` URLs into image fields).
- **`/journal`** — card grid with read-only **modal** reading; posts are JSON on `page:journal` (no blog motor). Use **Add post** in `/admin/cms/journal` for entries; article bodies support HTML via the rich editor.

Activate under `/admin/templates`, then edit **Home** at `/admin/cms/home` and static pages at `/admin/cms/editorial` and `/admin/cms/journal`.

Visually compare **`/shop`**, **`/cart`**, **`/checkout`**, and **`/profile`** to **`default-modern`**: atelier uses a horizontal catalogue strip + masonry row-cards, full-bleed alternating cart lines with a mobile checkout bar, a top-segment checkout rail with summary column on the left on large screens, and profile **top tab** chrome with **accordion** account sections — same engine data and hooks, deliberately different layout components.
