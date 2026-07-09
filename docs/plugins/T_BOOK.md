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
│   ├── attendee-fields.ts      # per-participant data schema + validation
│   ├── schemas.ts              # zod input validation
│   ├── api-key.ts              # tbk_ keys, SHA-256 at rest, timing-safe verify
│   ├── booking-query.ts        # filter → Mongo query (pure)
│   ├── booking-export.ts       # xlsx/csv smart export (dynamic option + attendee columns)
│   ├── rate-limit.ts           # fixed-window limiter for public endpoints
│   └── openapi.ts              # OpenAPI 3.1 spec for the public API
└── admin/                      # dashboard, groups, events, hotels, bookings
```

## Data model

- **Event group** — container + one API key (`tbk_…`). Only the SHA-256 hash and a display hint are stored; the plaintext is shown once on create/rotate. Public endpoints resolve their scope from the key. Optional **tBook directory** listing fields (`listOnTBookSite`, `listingTitle`, `listingUrl`, `listingImage`).
- **Event** — name, location, start/end dates, base ticket fee (`per_person` or `per_booking`), capacity, status, **`attendeeFieldSchema`** (per-event participant data fields). Can be standalone or nested in a group; reorderable.
- **Hotel** — n per group. `pricing` holds room types + **foglalási szakaszok** (addon groups) with priced booking options.
- **Booking** — **kapcsolattartó** (`customer`: name, email, phone, note) + optional billing, guest count, **`attendees[]`** (one row per ticket with key-value fields), raw `selections` map for hotel pricing, frozen `quote` breakdown, Stripe ids, status.

## Kapcsolattartó vs résztvevők

| Role | API field | When | Purpose |
| --- | --- | --- | --- |
| **Kapcsolattartó** | `customer` | Always | Person who books and pays — contact for emails, Stripe, support. Required even when booking for others (especially with hotel). |
| **Résztvevő** | `attendees[i].fields` | When event has `attendeeFieldSchema` | One object per ticket/guest — name, age, nationality, etc. for eligibility checks. |

Configure participant fields per event in admin: **Esemény szerkesztése → Résztvevői adatok**. Use the **Verseny sablon** for tournaments (name, email, birth year, nationality) or add custom fields.

Field types: `text`, `email`, `phone`, `number`, `date`, `select`. Internal keys are auto-generated from labels (hidden from moderators).

At booking time the server:
1. Validates `attendees.length === guests` when the event schema is non-empty.
2. Validates each required field per participant.
3. Snapshots `attendeeFieldSchema` on the booking so admin labels stay stable after event edits.

## Option schema & pricing engine

Each hotel option (`TBookOptionDef`) is a priced selector (room type, meals, extras). See `lib/pricing-types.ts`.

`calculateBookingQuote()` in `lib/pricing.ts` is pure and shared by admin preview, quote API, and checkout. **Total = ticket fee (+ accommodation base + option add-ons when a hotel is chosen)**.

Hotel add-ons use **foglalási szakaszok** (visual sections) containing **foglalási mezők** (individual questions). See admin hotel editor step **Extrák és felárak**.

## API

Base: `/api/plugins/t-book`. OpenAPI spec: `GET /api/plugins/t-book/openapi`.

**Public directory (no API key):**

| Route | Purpose |
| --- | --- |
| `GET /directory` | Active integrations listed on the tBook site (`listOnTBookSite` groups with upcoming events) |

**Public (header `X-TBook-Api-Key` or `Authorization: Bearer`)** — rate limited:

| Route | Purpose |
| --- | --- |
| `GET /events` | active events of the key's group |
| `GET /events/:id` | detail + hotels + option schemas + **`attendeeFieldSchema`** |
| `POST /quote` | server-side price calculation |
| `POST /bookings` | validate → pending booking → Stripe Checkout URL |
| `GET /bookings/status?bookingId=&session_id=` | payment status poll |

### `POST /bookings` body (excerpt)

```json
{
  "eventId": "...",
  "guests": 2,
  "customer": {
    "name": "Szervező Kovács",
    "email": "szervezo@example.com",
    "phone": "+36301234567",
    "note": "Csapatkapitány"
  },
  "attendees": [
    { "fields": { "full_name": "Nagy Béla", "email": "bela@example.com", "birth_year": 1998, "nationality": "hu" } },
    { "fields": { "full_name": "Kiss Anna", "email": "anna@example.com", "birth_year": 2001, "nationality": "hu" } }
  ],
  "hotelId": "...",
  "nights": 3,
  "selections": { "room_type": "standard", "meals": "half_board" }
}
```

- `customer` — always required (kapcsolattartó).
- `attendees` — required when the event defines `attendeeFieldSchema`; length must equal `guests`.
- Field keys in `attendees[].fields` match the event schema (returned by `GET /events/:id`).

**Admin (`requireAdmin()` session)** — `/admin/...`: dashboard, groups, events (incl. attendee field editor), hotels, bookings list/detail (kapcsolattartó + per-participant cards), export with dynamic attendee columns.

## Payments & invoicing (server-only secrets)

- Stripe Checkout uses `customer.email`. Confirmation email goes to the kapcsolattartó.
- Invoice uses `billing` when provided.
- Feature flags: `stripePayments`, `szamlazzInvoicing`, `pluginTBook`.

## Enablement checklist

1. Registered in `packages/core/src/plugins/registry.ts` (`t-book`).
2. Allowlisted in site `WSE_SITE_CONFIG_JSON` or legacy `deployments.config.json`.
3. DB flag `pluginTBook` enabled in `/admin` → Plugin beállítások.
4. `stripePayments` (+ `szamlazzInvoicing` for invoices) enabled.

## Tests

`npm run test:unit -- t-book` covers pricing, attendee validation, API keys, booking query, exports and rate limiting.
