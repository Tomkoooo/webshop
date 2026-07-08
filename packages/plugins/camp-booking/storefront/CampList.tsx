"use client"

import * as React from "react"
import { CampListView } from "./CampListView"
import type { CampListCamp } from "./camp-list-types"

export function CampList({ variant = "default" }: { variant?: "default" | "mineshow" }) {
  const [camps, setCamps] = React.useState<CampListCamp[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch("/api/plugins/camp-booking/camps")
        const data = (await res.json()) as { ok?: boolean; camps?: CampListCamp[]; error?: string }
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Nem sikerült betölteni a táborokat.")
        }
        if (!cancelled) {
          setCamps(data.camps ?? [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setCamps([])
          setError(err instanceof Error ? err.message : "Nem sikerült betölteni a táborokat.")
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <p className="font-minecraft-body text-center text-lg text-[#8b2500] py-16">{error}</p>
    )
  }

  if (camps === null) {
    return (
      <p className="font-minecraft-body text-center text-lg text-[#3d2817] py-16">
        Turnusok betöltése…
      </p>
    )
  }

  return <CampListView camps={camps} variant={variant} />
}
