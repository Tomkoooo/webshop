"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { authLoginPath } from "@wse/core/lib/auth-redirect"

async function fetchOrder(orderId: string) {
  const res = await fetch(`/api/user/orders/${orderId}`, {
    cache: "no-store",
    credentials: "same-origin",
  })

  if (res.status === 401) {
    return { unauthorized: true as const }
  }

  if (!res.ok) {
    return { notFound: true as const }
  }

  const data = await res.json()
  if (data?.error) {
    return { notFound: true as const }
  }

  return { order: data }
}

export function useUserOrderDetail(orderId: string) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [order, setOrder] = React.useState<unknown>(null)
  const [loading, setLoading] = React.useState(true)

  const sessionReady =
    status === "authenticated" && Boolean(session?.user?.id || session?.user?.email)

  React.useEffect(() => {
    if (status === "unauthenticated") {
      const path =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/profile/orders/${orderId}`
      router.push(authLoginPath(path))
      return
    }

    if (!sessionReady || !orderId) {
      setLoading(true)
      return
    }

    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined

    const run = async (attempt = 0) => {
      const result = await fetchOrder(orderId)
      if (cancelled) return

      if ("unauthorized" in result && result.unauthorized && attempt < 8) {
        pollTimer = setTimeout(() => void run(attempt + 1), 350)
        return
      }

      if ("order" in result && result.order) {
        setOrder(result.order)
        setLoading(false)
        return
      }

      if (attempt < 12) {
        pollTimer = setTimeout(() => void run(attempt + 1), 1500)
        return
      }

      setOrder(null)
      setLoading(false)
    }

    setLoading(true)
    setOrder(null)
    void run(0)

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [status, sessionReady, session?.user?.id, session?.user?.email, orderId, router])

  return { order, loading, sessionReady, status }
}
