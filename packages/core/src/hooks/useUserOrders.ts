"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { authLoginPath } from "@wse/core/lib/auth-redirect"

type LoadResult = {
  orders: unknown[]
  unauthorized?: boolean
  error?: string
}

async function fetchUserOrders(): Promise<LoadResult> {
  const res = await fetch("/api/user/orders", {
    cache: "no-store",
    credentials: "same-origin",
  })

  if (res.status === 401) {
    return { orders: [], unauthorized: true }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { orders: [], error: (body as { error?: string }).error || "Hiba a rendelések betöltésekor" }
  }

  const data = await res.json()
  if (Array.isArray(data)) {
    return { orders: data }
  }

  return { orders: [], error: (data as { error?: string })?.error || "Érvénytelen válasz" }
}

/**
 * Loads the logged-in user's orders after the session is ready.
 * Retries when the session cookie is not yet available and polls briefly after checkout (`?recent=1`).
 */
export function useUserOrders() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const recentCheckout = searchParams.get("recent") === "1"

  const [orders, setOrders] = React.useState<unknown[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const sessionReady =
    status === "authenticated" && Boolean(session?.user?.id || session?.user?.email)

  const applyResult = React.useCallback((result: LoadResult) => {
    setOrders(result.orders)
    setError(result.error ?? null)
  }, [])

  React.useEffect(() => {
    if (status === "unauthenticated") {
      const path =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/profile/orders"
      router.push(authLoginPath(path))
      return
    }

    if (!sessionReady) {
      setLoading(true)
      return
    }

    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined

    const run = async (attempt = 0) => {
      const result = await fetchUserOrders()
      if (cancelled) return

      if (result.unauthorized && attempt < 8) {
        pollTimer = setTimeout(() => void run(attempt + 1), 350)
        return
      }

      applyResult(result)

      const shouldPollEmpty =
        recentCheckout &&
        result.orders.length === 0 &&
        !result.unauthorized &&
        attempt < 24

      if (shouldPollEmpty) {
        pollTimer = setTimeout(() => void run(attempt + 1), 2000)
        return
      }

      setLoading(false)
    }

    setLoading(true)
    setError(null)
    void run(0)

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [status, sessionReady, session?.user?.id, session?.user?.email, recentCheckout, router, applyResult])

  React.useEffect(() => {
    if (!sessionReady) return

    const refresh = () => {
      void fetchUserOrders().then((result) => {
        if (!result.unauthorized) applyResult(result)
      })
    }

    window.addEventListener("focus", refresh)
    return () => window.removeEventListener("focus", refresh)
  }, [sessionReady, applyResult])

  return { orders, loading, error, sessionReady, status }
}
