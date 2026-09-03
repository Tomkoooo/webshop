import "server-only"

import crypto from "node:crypto"
import type { ITBookOrganization } from "../models/TBookOrganization"
import { decryptOrgSecret } from "./org-secrets"

/**
 * Server-to-server client for tDarts' `@tdarts/api` partner-enroll surface.
 * Contract: docs/api/partner-embed-and-enroll.md in tdarts_torunament.
 * Also re-exports the org's public embed config (apiBaseUrl/embedClientId —
 * no secret) so the storefront can read tournament data directly from
 * api.tdarts.hu without proxying through tbook.
 */

export type TDartsCredentials = {
  apiBaseUrl: string
  partnerClientId: string
  partnerClientSecret: string
}

export type TDartsEmbedConfig = {
  apiBaseUrl: string
  embedClientId: string
}

export function resolveTDartsCredentials(
  org: Pick<ITBookOrganization, "settings"> | null | undefined
): TDartsCredentials | null {
  const t = org?.settings?.tdarts
  if (!t?.enabled) return null
  const apiBaseUrl = t.apiBaseUrl?.trim().replace(/\/+$/, "")
  const partnerClientId = t.partnerClientId?.trim()
  const partnerClientSecret = decryptOrgSecret(t.partnerClientSecretEnc)
  if (!apiBaseUrl || !partnerClientId || !partnerClientSecret) return null
  return { apiBaseUrl, partnerClientId, partnerClientSecret }
}

export function resolveTDartsEmbedConfig(
  org: Pick<ITBookOrganization, "settings"> | null | undefined
): TDartsEmbedConfig | null {
  const t = org?.settings?.tdarts
  if (!t?.enabled) return null
  const apiBaseUrl = t.apiBaseUrl?.trim().replace(/\/+$/, "")
  const embedClientId = t.embedClientId?.trim()
  if (!apiBaseUrl || !embedClientId) return null
  return { apiBaseUrl, embedClientId }
}

function signHmac(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")
}

async function partnerFetch(
  creds: TDartsCredentials,
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string }
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  const rawBody = init.body !== undefined ? JSON.stringify(init.body) : ""
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = signHmac(creds.partnerClientSecret, timestamp, rawBody)

  const headers: Record<string, string> = {
    "X-Client-Id": creds.partnerClientId,
    "X-Client-Secret": creds.partnerClientSecret,
    "X-Timestamp": timestamp,
    "X-Signature": signature,
  }
  if (init.body !== undefined) headers["Content-Type"] = "application/json"
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey

  let res: Response
  try {
    res = await fetch(`${creds.apiBaseUrl}${path}`, {
      method: init.method,
      headers,
      body: init.body !== undefined ? rawBody : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : "Network error" }
  }

  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    // non-JSON body
  }
  if (!res.ok) {
    const message =
      json && typeof json === "object" && "error" in json
        ? String((json as { error: unknown }).error)
        : `tDarts API ${res.status}`
    return { ok: false, status: res.status, error: message }
  }
  return { ok: true, data: json }
}

export type TDartsCapacity = {
  tournamentCode: string
  playerCount: number
  maxPlayers: number
  waitingListCount: number
  spotsRemaining: number
  registrationOpen: boolean
  status: string
}

export async function getTDartsCapacity(
  creds: TDartsCredentials,
  tournamentCode: string
): Promise<TDartsCapacity> {
  const result = await partnerFetch(creds, `/partner/tournaments/${tournamentCode}/capacity`, {
    method: "GET",
  })
  if (!result.ok) throw new Error(result.error)
  return result.data as TDartsCapacity
}

export type TDartsEnrollInput = {
  tournamentCode: string
  email: string
  name: string
  country?: string
  /** ISO date (YYYY-MM-DD) — only ever set on first account creation on tDarts, never overwritten. */
  birthDate?: string
  orderId: string
  amount?: number
  currency?: string
  paidAt?: string
}

export type TDartsEnrollResult = {
  userId: string
  playerId: string
  tournamentCode: string
  rosterStatus: "applied" | "waiting"
  createdUser: boolean
  createdPlayer: boolean
  alreadyRegistered: boolean
  orderId: string
}

/** Idempotent on (clientId, orderId) — safe to retry. */
export async function enrollTDartsPlayer(
  creds: TDartsCredentials,
  input: TDartsEnrollInput
): Promise<TDartsEnrollResult> {
  const { tournamentCode, ...body } = input
  const result = await partnerFetch(creds, `/partner/tournaments/${tournamentCode}/enroll`, {
    method: "POST",
    body,
    idempotencyKey: input.orderId,
  })
  if (!result.ok) throw new Error(result.error)
  return result.data as TDartsEnrollResult
}

export type TDartsPairMember = {
  email: string
  name: string
  country?: string
  /** ISO date (YYYY-MM-DD) — only ever set on first account creation on tDarts, never overwritten. */
  birthDate?: string
}

export type TDartsEnrollPairInput = {
  tournamentCode: string
  member1: TDartsPairMember
  member2: TDartsPairMember
  teamName?: string
  orderId: string
  amount?: number
  currency?: string
  paidAt?: string
}

export type TDartsEnrollPairResult = {
  pairPlayerId: string
  tournamentCode: string
  rosterStatus: "applied" | "waiting"
  member1PlayerId: string
  member2PlayerId: string
  alreadyRegistered: boolean
  orderId: string
}

/**
 * Enrolls a doubles/pairs ticket into a `participationMode: 'pair'` tDarts
 * tournament — one call registers both members as a single roster unit.
 * Idempotent on (clientId, orderId); `orderId` must be unique per pair, not
 * per member (see docs/api/partner-embed-and-enroll.md in tdarts_torunament).
 */
export async function enrollTDartsPair(
  creds: TDartsCredentials,
  input: TDartsEnrollPairInput
): Promise<TDartsEnrollPairResult> {
  const { tournamentCode, member1, member2, ...rest } = input
  const body = {
    email: member1.email,
    name: member1.name,
    country: member1.country,
    birthDate: member1.birthDate,
    partner: {
      email: member2.email,
      name: member2.name,
      country: member2.country,
      birthDate: member2.birthDate,
    },
    ...rest,
  }
  const result = await partnerFetch(creds, `/partner/tournaments/${tournamentCode}/enroll`, {
    method: "POST",
    body,
    idempotencyKey: input.orderId,
  })
  if (!result.ok) throw new Error(result.error)
  return result.data as TDartsEnrollPairResult
}
