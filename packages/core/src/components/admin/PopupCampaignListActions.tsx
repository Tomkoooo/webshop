"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2, Pencil } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import type { PopupCampaign } from "@wse/core/lib/popup-campaign-schema"

export function PopupCampaignCreateButton() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const create = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/popup-campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("Létrehozás sikertelen")
      const data = (await res.json()) as PopupCampaign
      router.push(`/admin/cms/popups/${data.id}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="default" className="h-12 px-6" onClick={create} disabled={loading}>
      {loading ? <LoadingSpinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      Új popup
    </Button>
  )
}

export function PopupCampaignDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const remove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Biztosan törlöd?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/popup-campaigns/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Törlés sikertelen")
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={remove} disabled={loading} title="Törlés">
      {loading ? <LoadingSpinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4 text-rose-400" />}
    </Button>
  )
}

export function PopupCampaignEditLink({ id }: { id: string }) {
  return (
    <Link href={`/admin/cms/popups/${id}`}>
      <Button variant="ghost" size="icon" title="Szerkesztés">
        <Pencil className="h-4 w-4" />
      </Button>
    </Link>
  )
}
