"use client"

import { useCallback, useEffect, useState } from "react"
import { campAdminApi, type CampDashboardStats } from "./camp-api"

export function useCampDashboard() {
  const [stats, setStats] = useState<CampDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    return campAdminApi<{ stats: CampDashboardStats }>("dashboard")
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { stats, loading, error, reload }
}
