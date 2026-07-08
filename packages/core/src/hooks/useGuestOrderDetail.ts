"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

async function fetchGuestOrder(orderId: string, token: string) {
  const params = new URLSearchParams({ token })
  const res = await fetch(`/api/orders/guest/${orderId}?${params.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  })

  if (res.status === 403) {
    return { forbidden: true as const }
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

export function useGuestOrderDetail(orderId: string) {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() || ""
  const [order, setOrder] = React.useState<unknown>(null)
  const [loading, setLoading] = React.useState(true)
  const [forbidden, setForbidden] = React.useState(false)

  React.useEffect(() => {
    if (!orderId || !token) {
      setLoading(false)
      setForbidden(!token)
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setForbidden(false)
      const result = await fetchGuestOrder(orderId, token)
      if (cancelled) return

      if ("forbidden" in result && result.forbidden) {
        setForbidden(true)
        setOrder(null)
        setLoading(false)
        return
      }

      if ("order" in result && result.order) {
        setOrder(result.order)
        setLoading(false)
        return
      }

      setOrder(null)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [orderId, token])

  return { order, loading, forbidden, token }
}
