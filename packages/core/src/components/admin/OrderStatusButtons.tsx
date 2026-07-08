"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { toast } from "sonner"
import { updateOrderStatus } from "@wse/core/actions/admin-orders"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"

const STATUSES = [
  { value: "pending", label: "FÜGGŐBEN", color: "amber" },
  { value: "processing", label: "FELDOLGOZÁS", color: "blue" },
  { value: "shipped", label: "SZÁLLÍTVA", color: "purple" },
  { value: "delivered", label: "KÉZBESÍTVE", color: "emerald" },
  { value: "cancelled", label: "TÖRÖLVE", color: "rose" },
] as const

type OrderStatusValue = (typeof STATUSES)[number]["value"]

type OrderStatusButtonsProps = {
  orderId: string
  currentStatus: string
  onUpdated?: () => void
}

function statusButtonClasses(status: (typeof STATUSES)[number], isActive: boolean) {
  if (!isActive) {
    return "border-white/5 text-neutral-500 hover:text-white hover:bg-white/5"
  }
  switch (status.color) {
    case "amber":
      return "border-amber-500 bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10"
    case "blue":
      return "border-blue-500 bg-blue-500/20 text-blue-500 shadow-lg shadow-blue-500/10"
    case "purple":
      return "border-purple-500 bg-purple-500/20 text-purple-500 shadow-lg shadow-purple-500/10"
    case "emerald":
      return "border-emerald-500 bg-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/10"
    case "rose":
      return "border-rose-500 bg-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/10"
    default:
      return "border-white/10 bg-white/5 text-neutral-500"
  }
}

export function OrderStatusButtons({ orderId, currentStatus, onUpdated }: OrderStatusButtonsProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<OrderStatusValue | null>(null)

  const handleStatusClick = async (nextStatus: OrderStatusValue) => {
    if (isUpdating || nextStatus === currentStatus) return

    setPendingStatus(nextStatus)
    setIsUpdating(true)
    try {
      await updateOrderStatus(orderId, nextStatus)
      router.refresh()
      onUpdated?.()
      const label = STATUSES.find((s) => s.value === nextStatus)?.label ?? nextStatus
      toast.success(`Rendelés állapota frissítve: ${label}`)
    } catch (error) {
      console.error("Order status update failed:", error)
      toast.error("Az állapot frissítése sikertelen. Próbálja újra.")
    } finally {
      setIsUpdating(false)
      setPendingStatus(null)
    }
  }

  return (
    <div className="space-y-3">
      {isUpdating ? (
        <p
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 animate-pulse"
          role="status"
          aria-live="polite"
        >
          <LoadingSpinner size="xs" className="shrink-0" />
          Állapot mentése…
        </p>
      ) : null}
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 transition-opacity duration-200",
          isUpdating && "opacity-70 pointer-events-none"
        )}
        aria-busy={isUpdating}
      >
        {STATUSES.map((status) => {
          const isActive = currentStatus === status.value
          const isLoadingThis = isUpdating && pendingStatus === status.value

          return (
            <Button
              key={status.value}
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => void handleStatusClick(status.value)}
              className={cn(
                "w-full h-14 rounded-none border text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                statusButtonClasses(status, isActive),
                isLoadingThis && "ring-1 ring-white/30"
              )}
            >
              {isLoadingThis ? (
                <LoadingSpinner size="xs" className="mr-2 shrink-0" />
              ) : isActive ? (
                <CheckCircle2 className="w-3 h-3 mr-2 shrink-0" />
              ) : null}
              {status.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
