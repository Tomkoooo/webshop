# tBook — event & lodging booking plugin (`t-book`)

Admin panel + secure backend API for event tickets and optional hotel bookings with dynamic pricing, Stripe payments and szamlazz.hu invoicing. No public storefront pages yet — future landing pages consume the API-key-protected endpoints.

## Layout

```
packages/plugins/t-book/
├── plugin.config.ts            # manifest, admin nav, api.handle
├── api/handlers.ts             # public (API key) + admin (session) routes
├── services/
│   ├── event-service.ts        # groups / events / hotels CRUD, API keys, dashboard
│   ├── booking-service.ts      # server-side quotes, pending bookings, admin table
│   ├── checkout-service.ts     # Stripe Checkout + idempotent webhook finalize
│   └── invoice-service.ts      # szamlazz.hu adapter (reuses core InvoicingSzamlazzService)
├── models/                     # TBookEventGroup, TBookEvent, TBookHotel, TBookBooking
├── lib/
│   ├── pricing.ts              # pure pricing engine (shared server + admin preview)
│   ├── pricing-types.ts        # option schema types
│   ├── schemas.ts              # zod input validation
│   ├── api-key.ts              # tbk_ keys, SHA-256 at rest, timing-safe verify
│   ├── booking-query.ts        # filter → Mongo query (pure)
│   ├── booking-export.ts       # xlsx/csv smart export (dynamic option columns)
│   ├── rate-limit.ts           # fixed-window limiter for public endpoints
│   └── openapi.ts              # OpenAPI 3.1 spec for the public API
└── admin/                      # dashboard, groups, events, hotels + option editor, bookings
```

## Data model

- **Event group** — container + one API key (`tbk_…`). Only the SHA-256 hash and a display hint are stored; the plaintext is shown once on create/rotate. Public endpoints resolve their scope from the key.
- **Event** — name, location, start/end dates, base ticket fee (`per_person` or `per_booking`), capacity, status. Can be standalone or nested in a group; reorderable.
- **Hotel** — n per event. `pricing` holds a base rate (`per_person_per_night` | `per_night` | `per_person` | `per_booking`) plus a flexible **option schema**.
- **Booking** — customer + optional billing, guests, nights, raw `selections` map, frozen price `quote` breakdown, Stripe ids, status (`pending → checkout_started → paid → confirmed | cancelled | expired`), invoice status.

## Option schema & pricing engine

Each hotel option (`TBookOptionDef`) is a key-value selector:

| Field | Meaning |
| --- | --- |
| `key`, `label`, `type` | `select`, `multiselect`, `number`, `checkbox` |
| `choices[]` | per-choice `priceHuf` + `priceMode` (select types) |
| `unitPriceHuf` + `priceMode` | number/checkbox pricing |
| `priceMode` | `fixed`, `per_person`, `per_night`, `per_person_per_night`, `percent` (of accommodation base) |
| `dependsOn` | show/charge only when another option matches (e.g. accessibility only for certain rooms) |
| `required`, `defaultValue`, `min`/`max` | validation |

`calculateBookingQuote()` in `lib/pricing.ts` is pure and isomorphic: the admin live preview imports it directly, the API runs it server-side, so totals always agree. **Total = ticket fee (+ accommodation base + option add-ons when a hotel is chosen)**; accommodation is optional per booking.

To add a new pricing behaviour, extend `TBookPriceMode` in `pricing-types.ts`, handle it in `scaleByMode()` and add cases to `tests/unit/t-book-pricing.test.ts`.

## API

Base: `/api/plugins/t-book`. OpenAPI spec: `GET /api/plugins/t-book/openapi`.

**Public (header `X-TBook-Api-Key` or `Authorization: Bearer`)** — rate limited:

| Route | Purpose |
| --- | --- |
| `GET /events` | active events of the key's group |
| `GET /events/:id` | detail + hotels + option schemas |
| `POST /quote` | server-side price calculation |
| `POST /bookings` | validate → pending booking → Stripe Checkout URL |
| `GET /bookings/status?bookingId=&session_id=` | payment status poll |

**Admin (`requireAdmin()` session)** — `/admin/...`: dashboard, groups CRUD + `rotate-key`, events CRUD + `reorder`, hotels CRUD, `quote` preview, bookings list with filters (`search`, `eventId`, `groupId`, `hotelId`, `status`, `invoiceStatus`, `optionKey`+`optionValue`, `dateFrom/To`, paging), `bookings/facets`, `bookings/export?format=xlsx|csv`, per-booking `status`, `invoice` (issue/retry), `invoice/reverse`, `invoice/pdf`.

## Payments & invoicing (server-only secrets)

- Stripe Checkout session is created server-side (`checkout-service.ts`, metadata `checkoutKind: "t_book"`); the client only ever receives the redirect URL. The shared webhook (`packages/plugins/shop/app/api/stripe/webhook/route.ts`) branches on the metadata and calls `finalizeBookingFromStripeSession` (atomic claim → idempotent) or `expireBooking`.
- On payment: booking → `paid`, szamlazz.hu invoice issued via `invoice-service.ts` (adapter around core `InvoicingSzamlazzService`, so email delivery + PDF storage behave like shop orders), confirmation email sent (template `t_book_booking_confirmation`).
- Feature flags: `stripePayments`, `szamlazzInvoicing`, and the plugin flag `pluginTBook`.
- Env: standard `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SZAMLAZZ_*`; optional `TBOOK_INVOICE_VAT_PERCENT` (default 27).

## Enablement checklist

1. Registered in `packages/core/src/plugins/registry.ts` (`t-book`).
2. Allowlisted in `deployments.config.json` (currently the `default` deployment) or in the site's `WSE_SITE_CONFIG_JSON`.
3. DB flag `pluginTBook` enabled in `/admin` → Plugin beállítások.
4. `stripePayments` (+ `szamlazzInvoicing` for invoices) enabled.

## Tests

`npm run test:unit -- t-book` covers the pricing engine, selection validation, API-key hashing/verification, booking query builder, exports and rate limiting; `plugins-contract.test.ts` validates plugin registration.
