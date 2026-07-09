"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban } from "lucide-react"
import { toast } from "sonner"
import { cancelOrder } from "@wse/core/actions/admin-orders"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { cn } from "@wse/core/lib/utils"

type OrderCancelButtonProps = {
  orderId: string
  disabled?: boolean
  onCancelled?: () => void
  className?: string
}

export function OrderCancelButton({
  orderId,
  disabled = false,
  onCancelled,
  className,
}: OrderCancelButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isCancelling) return
    setOpen(nextOpen)
    if (!nextOpen) setReason("")
  }

  const handleConfirmCancel = async () => {
    if (isCancelling || disabled) return

    setIsCancelling(true)
    try {
      const result = await cancelOrder(orderId, reason.trim() || undefined)
      setOpen(false)
      setReason("")
      router.refresh()
      onCancelled?.()

      const details: string[] = []
      if (result.refunded) details.push("Stripe visszatérítés kész")
      if (result.invoiceReversed) {
        details.push(
          result.reversalInvoiceId
            ? `Számla sztornózva (${result.reversalInvoiceId})`
            : "Számla sztornózva"
        )
      }
      if (result.stockRestored) details.push("Készlet visszaállítva")
      if (result.cancellationReason) details.push("Törlési email elküldve")

      toast.success(
        details.length > 0
          ? `Rendelés törölve. ${details.join(" · ")}`
          : "Rendelés törölve."
      )
    } catch (error) {
      console.error("Order cancellation failed:", error)
      toast.error(error instanceof Error ? error.message : "A rendelés törlése sikertelen.")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled || isCancelling}
        onClick={() => setOpen(true)}
        className={cn(
          "h-12 w-full rounded-md border border-rose-500/40 bg-rose-500/10 text-xs font-medium text-muted-foreground text-rose-400 hover:bg-rose-500/20 hover:text-rose-800",
          className
        )}
      >
        <Ban className="mr-2 h-3.5 w-3.5 shrink-0" />
        Rendelés törlése
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-md border-border bg-background text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Rendelés törlése
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              A művelet visszatéríti a Stripe fizetést (ha kártyás volt), sztornózza a kiállított
              számlát (ha van), visszaállítja a készletet — beleértve a sorszámos példányokat is —
              és a rendelés állapotát „Törölve”-re állítja. A vásárló két emailt kap: állapotváltozás
              és törlési értesítés (sztornó számla PDF-fel, ha volt kiállított számla).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor={`cancel-reason-${orderId}`}
              className="text-xs font-medium text-muted-foreground text-muted-foreground"
            >
              Indoklás (opcionális)
            </label>
            <textarea
              id={`cancel-reason-${orderId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isCancelling}
              rows={4}
              maxLength={2000}
              placeholder="Pl. a vásárló kérte a lemondást, hibás cím, készlethiány…"
              className="w-full resize-y border border-border bg-neutral-950 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500/40"
            />
            <p className="text-xs text-muted-foreground">
              Ha megadod, az indoklás megjelenik a törlési emailben is.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isCancelling}
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-md border-border text-xs font-medium text-muted-foreground"
            >
              Mégse
            </Button>
            <Button
              type="button"
              disabled={isCancelling}
              onClick={() => void handleConfirmCancel()}
              className="h-10 rounded-md bg-rose-600 text-xs font-medium text-muted-foreground hover:bg-rose-500"
            >
              {isCancelling ? (
                <>
                  <LoadingSpinner size="xs" className="mr-2 shrink-0" />
                  Törlés…
                </>
              ) : (
                "Törlés megerősítése"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
