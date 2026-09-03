import crypto from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { enrollTDartsPair, enrollTDartsPlayer } from "@wse/plugin-t-book/lib/tdarts-client"

const creds = {
  apiBaseUrl: "https://api.tdarts.hu",
  partnerClientId: "tbook-engine",
  partnerClientSecret: "shh-secret",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("enrollTDartsPlayer", () => {
  it("signs the request with a matching HMAC and posts to the individual enroll endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        userId: "u1",
        playerId: "p1",
        tournamentCode: "ABCD",
        rosterStatus: "applied",
        createdUser: true,
        createdPlayer: true,
        alreadyRegistered: false,
        orderId: "booking-1:0",
      })
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await enrollTDartsPlayer(creds, {
      tournamentCode: "ABCD",
      email: "player@example.com",
      name: "Player One",
      country: "HU",
      orderId: "booking-1:0",
      amount: 5000,
      currency: "HUF",
    })

    expect(result.rosterStatus).toBe("applied")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://api.tdarts.hu/partner/tournaments/ABCD/enroll")
    expect(init.method).toBe("POST")

    const headers = init.headers as Record<string, string>
    expect(headers["X-Client-Id"]).toBe("tbook-engine")
    expect(headers["X-Client-Secret"]).toBe("shh-secret")
    expect(headers["Idempotency-Key"]).toBe("booking-1:0")

    const rawBody = init.body as string
    const parsed = JSON.parse(rawBody)
    expect(parsed).toEqual({
      email: "player@example.com",
      name: "Player One",
      country: "HU",
      orderId: "booking-1:0",
      amount: 5000,
      currency: "HUF",
    })

    const expectedSignature = crypto
      .createHmac("sha256", creds.partnerClientSecret)
      .update(`${headers["X-Timestamp"]}.${rawBody}`)
      .digest("hex")
    expect(headers["X-Signature"]).toBe(expectedSignature)
  })

  it("throws with the upstream error message on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "Tournament is full" }, 409)))

    await expect(
      enrollTDartsPlayer(creds, {
        tournamentCode: "ABCD",
        email: "a@b.com",
        name: "A",
        orderId: "o1",
      })
    ).rejects.toThrow("Tournament is full")
  })
})

describe("enrollTDartsPair", () => {
  it("posts both members under `partner` to the same enroll endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        pairPlayerId: "pair-1",
        tournamentCode: "PAIR",
        rosterStatus: "applied",
        member1PlayerId: "p1",
        member2PlayerId: "p2",
        alreadyRegistered: false,
        orderId: "booking-2:0",
      })
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await enrollTDartsPair(creds, {
      tournamentCode: "PAIR",
      member1: { email: "one@example.com", name: "Player One", country: "HU" },
      member2: { email: "two@example.com", name: "Player Two", country: "SK" },
      orderId: "booking-2:0",
    })

    expect(result.pairPlayerId).toBe("pair-1")
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://api.tdarts.hu/partner/tournaments/PAIR/enroll")
    const parsed = JSON.parse(init.body as string)
    expect(parsed).toEqual({
      email: "one@example.com",
      name: "Player One",
      country: "HU",
      partner: { email: "two@example.com", name: "Player Two", country: "SK" },
      orderId: "booking-2:0",
    })
  })
})
