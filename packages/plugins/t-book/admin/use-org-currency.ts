"use client"

import { useEffect, useState } from "react"
import { DEFAULT_TBOOK_CURRENCY, normalizeTBookCurrency, type TBookCurrencyCode } from "../lib/currency"
import { tbookOrgApi } from "./org-api"

/** Active organization currency for admin price display (defaults to HUF). */
export function useOrgCurrency(): { currency: string; loading: boolean } {
  const [currency, setCurrency] = useState<TBookCurrencyCode>(DEFAULT_TBOOK_CURRENCY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void tbookOrgApi
      .context()
      .then((res) => {
        if (cancelled) return
        const code = res.organization?.settings?.currency
        setCurrency(normalizeTBookCurrency(code))
      })
      .catch(() => {
        if (!cancelled) setCurrency(DEFAULT_TBOOK_CURRENCY)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { currency, loading }
}
