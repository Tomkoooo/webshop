"use client"

import {
  Dialog,
  DialogContent,
} from "@wse/core/components/ui/dialog"
import { PopupCampaignBody, type PopupCampaignDisplay } from "@wse/core/components/storefront/popups/PopupCampaignBody"
import { cn } from "@wse/core/lib/utils"

export function PopupCampaignDialog({
  open,
  onOpenChange,
  campaign,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: PopupCampaignDisplay & { id?: string }
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "z-[90] max-h-[min(90vh,calc(100vh-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto border-white/15 bg-neutral-950 p-4 sm:max-w-lg sm:p-6",
          !campaign.showCloseButton && "[&>button]:hidden"
        )}
        onInteractOutside={(e) => {
          if (!campaign.showCloseButton) e.preventDefault()
        }}
      >
        <PopupCampaignBody campaign={campaign} />
      </DialogContent>
    </Dialog>
  )
}
