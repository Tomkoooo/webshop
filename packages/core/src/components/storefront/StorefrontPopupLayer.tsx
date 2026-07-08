"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { PopupCampaignDialog } from "@wse/core/components/storefront/popups/PopupCampaignDialog"
import { matchesAnyTargetPath } from "@wse/core/lib/popup-path-match"
import {
  dismissPopupId,
  readDismissedPopupIds,
} from "@wse/core/lib/popup-dismiss-storage"
import type { PopupCampaign } from "@wse/core/lib/popup-campaign-schema"

export function StorefrontPopupLayer({
  campaigns,
}: {
  campaigns: PopupCampaign[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString() ? `?${searchParams.toString()}` : ""

  const [dismissedIds, setDismissedIds] = React.useState<string[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setDismissedIds(readDismissedPopupIds())
    setHydrated(true)
  }, [])

  if (!hydrated || pathname.startsWith("/admin")) return null

  const matching = campaigns.filter(
    (c) =>
      !dismissedIds.includes(c.id) &&
      matchesAnyTargetPath(pathname, search, c.targetPaths)
  )

  const active = matching[0]
  if (!active) return null

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dismissPopupId(active.id)
      setDismissedIds((prev) => [...prev, active.id])
    }
  }

  return (
    <PopupCampaignDialog
      open
      onOpenChange={handleOpenChange}
      campaign={active}
    />
  )
}
