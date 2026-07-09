# Admin UI baseline (pre-refresh)

Captured from code audit before the v2 admin token refresh (2026-07-09).

## Visual characteristics (legacy)

- Fixed dark shell: `#0A0A0B` background, 288px (`w-72`) sidebar
- Navigation: all-caps bold labels (`text-[10px]`–`text-sm`, `tracking-widest`)
- Cards: `bg-white/5 border-white/10 rounded-2xl`
- Labels: 10px uppercase micro-labels via `AdminFormField`
- Accent: gold links (`--color-highlight` / `#ffd700`)
- Headings: italic uppercase `font-heading` with underline accent

## Key routes to compare after refresh

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard KPIs |
| `/admin/orders` | Orders workspace (dense filters + table) |
| `/admin/cms/settings?section=theme` | CMS / theme settings |
| `/admin/products` | Product list |

## Local comparison

```bash
npm run dev
# open http://localhost:3000/admin
```
