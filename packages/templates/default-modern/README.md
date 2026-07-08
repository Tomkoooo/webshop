# default-modern

The starting template for every webshop fork. Wraps the existing visual block-based homepage editor and the polished dark-mode storefront chrome (`Navbar`, `Footer`).

- Home page is edited at `/admin/cms/home` via `VisualHomepageEditor`; the canvas uses this template’s chrome and `pages/home/Render.tsx` (same as the storefront).
- Shop, PDP, About, and optional `flowPages.*.shell` copy are **storefront-only** in this engine — there is no `/admin/cms` editor for them; only **`/admin/cms/home`** exposes the block CMS.
- Theme tokens default to today's dark palette and can be overridden per-shop via the existing theme editor.
- **Contact e-mails** are admin-managed (`/admin/cms/settings?section=contact`). Templates read `deps.siteContact.emails` on the homepage and receive `contactEmails` on `chrome.Footer`. Reusable UI: `@/templates/site-contact` (`SiteContactEmailsList`, `ContactInquiryForm`).

To create a sibling template, copy this folder, change `manifest.id` and `manifest.name` in `template.config.ts`, modify chrome/page renderers, then register the new template in `src/templates/registry.ts`.
