/**
 * OpenAPI 3.1 spec for the tBook public API (API-key protected endpoints used
 * by future landing pages). Served at `GET /api/plugins/t-book/openapi`.
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
    "Kulcs-érték pár opciók a hotel konfigurációja szerint (pl. { room_type: 'suite', meals: 'half_board', accessibility: true }).",
  additionalProperties: {
    oneOf: [
      { type: "string" },
      { type: "number" },
      { type: "boolean" },
      { type: "array", items: { type: "string" } },
    ],
  },
} as const

export function buildTBookOpenApiSpec(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "tBook public API",
      version: "1.0.0",
      description:
        "Esemény + szállás foglalási API külső landing oldalaknak. Minden végpont a csoporthoz tartozó API kulcsot várja az `X-TBook-Api-Key` fejlécben (vagy `Authorization: Bearer <kulcs>`). Stripe és számlázási titkok kizárólag a szerveren élnek — a kliens csak checkout URL-t kap.",
    },
    servers: [{ url: `${baseUrl}/api/plugins/t-book` }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "X-TBook-Api-Key" },
      },
      schemas: {
        PriceQuote: quote,
        Selections: selections,
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
              },
            },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            nights: { type: "integer" },
            ticketFeeHuf: { type: "number" },
            ticketFeeMode: { type: "string", enum: ["per_person", "per_booking"] },
            heroImage: { type: "string" },
          },
        },
        Hotel: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            address: { type: "string" },
            gallery: { type: "array", items: { type: "string" } },
            pricing: {
              type: "object",
              description: "Alapdíj + dinamikus opció séma (select/number/checkbox/multiselect).",
            },
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
                  required: ["eventId", "guests", "customer"],
                  properties: {
                    eventId: { type: "string" },
                    guests: { type: "integer", minimum: 1 },
                    customer: {
                      type: "object",
                      required: ["name", "email", "phone"],
                      properties: {
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                        phone: { type: "string" },
                        note: { type: "string" },
                      },
                    },
                    billing: {
                      type: ["object", "null"],
                      description: "Számlázási cím a szamlazz.hu számlához.",
                      properties: {
                        name: { type: "string" },
                        zip: { type: "string" },
                        city: { type: "string" },
                        street: { type: "string" },
                        countryCode: { type: "string" },
                        taxNumber: { type: "string" },
                      },
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
          summary: "Foglalás fizetési státusz lekérdezése",
          parameters: [
            { name: "bookingId", in: "query", required: true, schema: { type: "string" } },
            { name: "session_id", in: "query", required: false, schema: { type: "string" } },
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
                        enum: ["none", "issued", "failed", "reversed"],
                      },
                      totalHuf: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }
}
