"use client"

import { useCallback, useEffect, useState } from "react"

const TOKEN_KEY = "core-admin-token"

export function getStoredToken(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(TOKEN_KEY) ?? ""
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

/** fetch wrapper that sends the operator token; callers handle non-OK statuses. */
export async function coreAdminFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "x-core-admin-token": getStoredToken(),
      ...(init?.body ? { "content-type": "application/json" } : {}),
    },
  })
}

/** Loads JSON from a core-admin API path; `unauthorized` drives the token prompt. */
export function useCoreAdminGet<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    coreAdminFetch(path)
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          setUnauthorized(true)
          return
        }
        const body = await res.json()
        if (!res.ok) {
          setError(String((body as { error?: string }).error ?? res.status))
          return
        }
        setUnauthorized(false)
        setError(null)
        setData(body as T)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
    return () => {
      cancelled = true
    }
  }, [path, nonce])

  return { data, error, unauthorized, reload }
}
