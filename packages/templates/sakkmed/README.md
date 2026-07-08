# SAKKMED template

Landing-only template for **SAKKMED 2005 Kft.** — rendezvénytechnika, installációk és teljes műszaki kivitelezés. Dark/gold visual language, multi-section homepage, eleven service/project static pages, and a contact inquiry form (no webshop).

Deployment key: `sakkmed` (`ENABLE_SHOP=false`).

Seed demo content from the legacy [Wix site](https://balazsgabor3.wixsite.com/sakkmed2). The seed script crawls every subpage, uploads images into MongoDB (`/api/media/…`), and updates CMS paths.

```bash
node scripts/seed/sakkmed-demo.mjs
```

CMS uploads in the visual editor use the same database-backed media API.
