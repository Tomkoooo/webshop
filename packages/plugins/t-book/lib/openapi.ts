/**
 * OpenAPI 3.1 spec for the tBook public API (API-key protected endpoints used
 * by landing pages and external frontends). Served at `GET /api/plugins/t-book/openapi`.
 */

const priceLine = {
  type: "object",
  properties: {
    key: { type: "string" },
    label: { type: "string" },
    amountHuf: { type: "number" },
  },
} as const

const quote = {
  type: "object",
  properties: {
    guests: { type: "integer" },
    nights: { type: "integer" },
    ticketSubtotalHuf: { type: "number" },
    accommodationBaseHuf: { type: "number" },
    accommodationOptionsHuf: { type: "number" },
    accommodationSubtotalHuf: { type: "number" },
    totalHuf: { type: "number" },
    lines: { type: "array", items: priceLine },
  },
} as const

const selections = {
  type: "object",
  description:
    "Kulcs-érték pár opciók a hotel konfigurációja szerint. Szállás: `room_type`, `package_deal` (egy csomag), vagy `package_units` (több csomag darabszámmal: `{ \"double\": 1, \"single\": 1 }`). Extrák: a hotel `extrasSection.options` kulcsai.",
  additionalProperties: {
    oneOf: [
      { type: "string" },
      { type: "number" },
      { type: "boolean" },
      { type: "array", items: { type: "string" } },
      {
        type: "object",
        description: "Csomag darabszámok (`package_units`).",
        additionalProperties: { type: "integer", minimum: 0 },
      },
    ],
  },
} as const

const attendeeField = {
  type: "object",
  properties: {
    key: { type: "string", description: "Gép kulcs (pl. full_name, birth_year)." },
    label: { type: "string" },
    type: {
      type: "string",
      enum: ["text", "email", "phone", "number", "date", "select"],
    },
    required: { type: "boolean" },
    helpText: { type: "string" },
    choices: {
      type: "array",
      items: {
        type: "object",
        properties: { value: { type: "string" }, label: { type: "string" } },
      },
    },
    min: { type: "number" },
    max: { type: "number" },
    sortOrder: { type: "integer" },
  },
} as const

const optionDef = {
  type: "object",
  properties: {
    key: { type: "string" },
    label: { type: "string" },
    type: { type: "string", enum: ["select", "multiselect", "number", "checkbox"] },
    required: { type: "boolean" },
    defaultValue: {},
    choices: {
      type: "array",
      items: {
        type: "object",
        properties: {
          value: { type: "string" },
          label: { type: "string" },
          priceHuf: { type: "number" },
          priceMode: {
            type: "string",
            enum: ["fixed", "per_person", "per_night", "per_person_per_night", "percent"],
          },
        },
      },
    },
    unitPriceHuf: { type: "number" },
    priceMode: {
      type: "string",
      enum: ["fixed", "per_person", "per_night", "per_person_per_night", "percent"],
    },
    min: { type: "number" },
    max: { type: "number" },
    sortOrder: { type: "integer" },
  },
} as const

const packageDeal = {
  type: "object",
  properties: {
    key: { type: "string" },
    label: { type: "string" },
    nights: { type: "integer", minimum: 1 },
    priceHuf: { type: "number", minimum: 0, description: "Egységár (egy csomag)." },
    maxGuests: {
      type: ["integer", "null"],
      minimum: 1,
      description:
        "Max guests per package unit. Server charges priceHuf × ceil(guests / maxGuests). When null/missing, maxGuests defaults to 1 (e.g. 4 guests → 4× single).",
    },
    inventoryUnits: {
      type: ["integer", "null"],
      minimum: 0,
      description:
        "Hotel allotment for this package (total bookable room units). Null = unlimited. Remaining stock is enforced at booking time.",
    },
    roomTypeKey: {
      type: ["string", "null"],
      description: "Ha megadva, csak ehhez a szobatípushoz köthető (both / room_nights mód).",
    },
    sortOrder: { type: "integer" },
  },
} as const

const hotelPricing = {
  type: "object",
  properties: {
    priceBasis: { type: "string", enum: ["net", "gross"] },
    vatPercent: { type: "number" },
    accommodationMode: {
      type: "string",
      enum: ["room_nights", "packages", "both"],
      description:
        "`room_nights`: szobatípus + éjszaka. `packages`: csak csomagajánlat. `both`: szoba + opcionális csomag.",
    },
    roomTypes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          baseRateHuf: { type: "number", description: "Alapdíj vendég / éj." },
          sortOrder: { type: "integer" },
        },
      },
    },
    packages: {
      type: "array",
      items: packageDeal,
      description: "Fix csomagajánlatok. `selections.package_deal` kulccsal választható.",
    },
    extrasSection: {
      type: ["object", "null"],
      properties: {
        label: { type: "string" },
        description: { type: "string" },
        options: { type: "array", items: optionDef },
      },
    },
  },
} as const

export function buildTBookOpenApiSpec(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "tBook public API",
      version: "1.2.0",
      description: [
        "Esemény + szállás foglalási API külső landing oldalaknak.",
        "Minden végpont a csoporthoz tartozó API kulcsot várja az `X-TBook-Api-Key` fejlécben (vagy `Authorization: Bearer <kulcs>`).",
        "",
        "**Foglalási mezők:** az esemény `attendeeFieldSchema` a csoport alapmezőiből és az esemény felülírásából áll össze (csoport `defaultAttendeeFieldSchema` + esemény `attendeeFieldSchemaMode`: `extend` | `replace`). A nyilvános API a már **feloldott** sémát adja vissza.",
        "",
        "**Csomagajánlatok:** ha egy csomagnál `maxGuests` meg van adva, a szállás alapár = `priceHuf × ceil(guests / maxGuests)`. Több csomag kombinálható a `selections.package_units` objektummal.",
        "",
        "**Visszatérés fizetés után:** küldd a `returnBaseUrl`-t (pl. a landing origin); a Stripe sikeres fizetés a `{returnBaseUrl}/foglalas/siker` oldalra irányít `return_to` paraméterrel.",
      ].join("\n"),
    },
    servers: [{ url: `${baseUrl}/api/plugins/t-book` }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "X-TBook-Api-Key" },
      },
      schemas: {
        PriceQuote: quote,
        Selections: selections,
        AttendeeField: attendeeField,
        AttendeePayload: {
          type: "object",
          required: ["fields"],
          properties: {
            fields: {
              type: "object",
              additionalProperties: { oneOf: [{ type: "string" }, { type: "number" }] },
            },
            members: {
              type: "array",
              description: "Csapat regisztráció (`registrationUnit: team`) esetén csapattagok.",
              items: {
                type: "object",
                required: ["fields"],
                properties: {
                  fields: {
                    type: "object",
                    additionalProperties: { oneOf: [{ type: "string" }, { type: "number" }] },
                  },
                },
              },
            },
          },
        },
        PackageDeal: packageDeal,
        HotelPricing: hotelPricing,
        OptionDef: optionDef,
        CheckoutStatus: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            status: {
              type: "string",
              enum: [
                "pending",
                "checkout_started",
                "paid",
                "confirmed",
                "cancelled",
                "expired",
              ],
            },
            invoiceStatus: {
              type: "string",
              enum: ["none", "pending", "issued", "failed", "reversed"],
            },
            invoiceReady: { type: "boolean" },
            vouchersReady: { type: "boolean" },
            returnBaseUrl: { type: ["string", "null"] },
            eventName: { type: "string" },
            totalHuf: { type: "number" },
            guests: { type: "integer" },
          },
        },
        Event: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            location: {
              type: "object",
              properties: {
                address: { type: "string" },
                lat: { type: ["number", "null"] },
                lng: { type: ["number", "null"] },
                mapEmbedUrl: { type: "string" },
              },
            },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            startTime: { type: ["string", "null"], description: "HH:mm (24h), opcionális." },
            endTime: { type: ["string", "null"], description: "HH:mm (24h), opcionális." },
            nights: { type: "integer", description: "Esemény hossza éjszakákban." },
            ticketFeeHuf: { type: "number" },
            ticketFeeMode: {
              type: "string",
              enum: ["per_person", "per_booking", "per_team"],
            },
            registrationUnit: {
              type: "string",
              enum: ["person", "team"],
              description: "`guests` jelentése: fő vagy csapat.",
            },
            playersPerTicket: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description:
                "Fixed players per entry when > 1 (e.g. pair = 2). For team events, 1 means a flexible roster up to teamMemberLimit.",
            },
            teamMemberLimit: {
              type: ["integer", "null"],
              description:
                "Max team members for flexible team rosters (playersPerTicket = 1). Ignored when playersPerTicket > 1.",
            },
            teamMemberFieldSchema: {
              type: "array",
              items: { $ref: "#/components/schemas/AttendeeField" },
            },
            currency: { type: "string", description: "ISO 4217 (pl. HUF, EUR)." },
            heroImage: { type: "string" },
            attendeeFieldSchema: {
              type: "array",
              items: { $ref: "#/components/schemas/AttendeeField" },
              description:
                "Feloldott foglalási mezők (csoport alap + esemény kiegészítés/felülírás). Egy elem minden jegyhez / résztvevőhöz.",
            },
          },
        },
        Hotel: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            address: { type: "string" },
            distanceFromVenueKm: { type: ["number", "null"] },
            gallery: { type: "array", items: { type: "string" } },
            currency: { type: "string" },
            bookingCapacity: {
              type: ["integer", "null"],
              description:
                "Hotel-level max accommodation guests (not per room/package). Null = unlimited.",
            },
            remainingCapacity: {
              type: ["integer", "null"],
              description:
                "Remaining hotel-level guest capacity. Null = unlimited. Sold-out hotels are omitted.",
            },
            roomInventory: {
              type: ["integer", "null"],
              description:
                "Shared room/package-unit pool across all packages (e.g. 20 rooms for single+double). Null = unlimited.",
            },
            remainingRoomInventory: {
              type: ["integer", "null"],
              description:
                "Remaining shared room units. Null = unlimited. Sold-out hotels are omitted.",
            },
            registrationFieldSchema: {
              type: "array",
              items: { $ref: "#/components/schemas/AttendeeField" },
              description: "Szállás-specifikus extra mezők (összeolvad az esemény mezőivel foglaláskor).",
            },
            pricing: { $ref: "#/components/schemas/HotelPricing" },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/events": {
        get: {
          summary: "Aktív események listája a kulcshoz tartozó csoportban",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      events: { type: "array", items: { $ref: "#/components/schemas/Event" } },
                    },
                  },
                },
              },
            },
            "401": { description: "Hiányzó vagy érvénytelen API kulcs" },
          },
        },
      },
      "/events/{eventId}": {
        get: {
          summary: "Esemény részletei + elérhető szállások és opció sémák",
          parameters: [
            { name: "eventId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      event: { $ref: "#/components/schemas/Event" },
                      groupBookingOptions: {
                        type: "array",
                        items: { $ref: "#/components/schemas/OptionDef" },
                        description: "Csoport szintű foglalási opciók (extrák), minden eseményhez.",
                      },
                      hotels: { type: "array", items: { $ref: "#/components/schemas/Hotel" } },
                    },
                  },
                },
              },
            },
            "404": { description: "Nem található" },
          },
        },
      },
      "/quote": {
        post: {
          summary: "Ár kalkuláció (jegy + opcionális szállás) — valós idejű előnézethez",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["eventId", "guests"],
                  properties: {
                    eventId: { type: "string" },
                    guests: { type: "integer", minimum: 1 },
                    accommodationGuests: {
                      type: ["integer", "null"],
                      minimum: 0,
                      description:
                        "Szállás létszám (lehet kevesebb, mint a belépők). Üres = minden belépő. 0 = nincs szállás.",
                    },
                    teamMemberCount: {
                      type: ["integer", "null"],
                      minimum: 1,
                      description:
                        "Tényleges játékoslétszám (rugalmas csapat). Csapattagonkénti ár szabályokhoz. Üres = jegyek × playersPerTicket.",
                    },
                    hotelId: { type: ["string", "null"] },
                    nights: {
                      type: ["integer", "null"],
                      description: "Éjszakák (room_nights / both). packages módban a csomag határozza meg.",
                    },
                    selections: { $ref: "#/components/schemas/Selections" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Számított ár",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      quote: { $ref: "#/components/schemas/PriceQuote" },
                    },
                  },
                },
              },
            },
            "400": { description: "Érvénytelen opciók / bemenet" },
          },
        },
      },
      "/bookings": {
        post: {
          summary: "Foglalás létrehozása → Stripe Checkout URL",
          description:
            "A szerver validál, árat számol, függő foglalást ment és Stripe Checkout munkamenetet indít. A válasz `checkoutUrl`-jére kell átirányítani a vásárlót.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["eventId", "guests", "customer", "billing"],
                  properties: {
                    eventId: { type: "string" },
                    guests: { type: "integer", minimum: 1 },
                    accommodationGuests: {
                      type: ["integer", "null"],
                      minimum: 0,
                      description:
                        "Szállás létszám (lehet kevesebb, mint a belépők). Üres = minden belépő. 0 = nincs szállás.",
                    },
                    teamMemberCount: {
                      type: ["integer", "null"],
                      minimum: 1,
                      description:
                        "Tényleges játékoslétszám (rugalmas csapat). Csapattagonkénti ár szabályokhoz.",
                    },
                    customer: {
                      type: "object",
                      description:
                        "Kapcsolattartó (fizető / szervező) — ezzel a személlyel tartják a kapcsolatot.",
                      required: ["name", "email", "phone"],
                      properties: {
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                        phone: { type: "string" },
                        note: { type: "string" },
                      },
                    },
                    attendees: {
                      type: "array",
                      description:
                        "Egy elem minden jegyhez / résztvevőhöz, ha az esemény `attendeeFieldSchema`-t definiál.",
                      items: { $ref: "#/components/schemas/AttendeePayload" },
                    },
                    billing: {
                      type: "object",
                      description:
                        "Számlázási adatok a szamlazz.hu számlához. `billingType`: personal | company | sport.",
                      required: ["name", "zip", "city", "street"],
                      properties: {
                        billingType: {
                          type: "string",
                          enum: ["personal", "company", "sport"],
                          default: "personal",
                        },
                        name: { type: "string" },
                        zip: { type: "string" },
                        city: { type: "string" },
                        street: { type: "string" },
                        countryCode: { type: "string", default: "HU" },
                        taxNumber: {
                          type: "string",
                          description:
                            "Kötelező, ha `billingType` = company. Sport esetén opcionális.",
                        },
                      },
                    },
                    returnBaseUrl: {
                      type: "string",
                      format: "uri",
                      description:
                        "A foglalást indító oldal origin-je (pl. https://worlddartsfestival.com). Stripe visszatérés és letöltések ehhez igazodnak.",
                    },
                    hotelId: { type: ["string", "null"] },
                    nights: { type: ["integer", "null"] },
                    selections: { $ref: "#/components/schemas/Selections" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Foglalás létrejött, fizetés indítható",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      bookingId: { type: "string" },
                      totalHuf: { type: "number" },
                      quote: { $ref: "#/components/schemas/PriceQuote" },
                      checkoutUrl: { type: "string" },
                      expiresAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "400": { description: "Érvénytelen bemenet / nincs szabad hely" },
            "429": { description: "Túl sok kérés" },
          },
        },
      },
      "/bookings/status": {
        get: {
          summary: "Foglalás fizetési státusz lekérdezése (API kulcs)",
          parameters: [
            { name: "bookingId", in: "query", required: true, schema: { type: "string" } },
            { name: "session_id", in: "query", required: false, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CheckoutStatus" },
                },
              },
            },
          },
        },
      },
      "/checkout/status": {
        get: {
          summary: "Foglalás fizetési státusz (vendég, session alapú)",
          description:
            "Nyilvános végpont a fizetés utáni oldalhoz — `session_id` + `bookingId` alapján, API kulcs nélkül.",
          parameters: [
            { name: "bookingId", in: "query", required: true, schema: { type: "string" } },
            { name: "session_id", in: "query", required: false, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CheckoutStatus" },
                },
              },
            },
          },
        },
      },
    },
  }
}
