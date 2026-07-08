"use client"

import * as React from "react"
import type { CheckoutStepAppearance } from "@wse/core/components/checkout/checkout-appearance"
import { cxSummaryMuted, cxSummaryStrong } from "@wse/core/components/checkout/checkout-appearance"
import { cn } from "@wse/core/lib/utils"

function parseIso(s: string): number {
  const t = Date.parse(s)
  return Number.isFinite(t) ? t : NaN
}

type Props = {
  reservationExpiresAtIso: string
  serverTimeIso?: string | null
  appearance?: CheckoutStepAppearance
  className?: string
}

/**
 * Display-only countdown for inventory hold (Stripe checkout handoff).
 * Uses optional serverTime to reduce visible skew vs client clock.
 */
export function ReservationCountdown({
  reservationExpiresAtIso,
  serverTimeIso,
  appearance = "dark",
  className,
}: Props) {
  const serverSkewMs = React.useMemo(() => {
    if (!serverTimeIso) return 0
    const serverMs = parseIso(serverTimeIso)
    if (!Number.isFinite(serverMs)) return 0
    return serverMs - Date.now()
  }, [serverTimeIso])

  const [remainingSec, setRemainingSec] = React.useState(() => {
    const end = parseIso(reservationExpiresAtIso)
    if (!Number.isFinite(end)) return 0
    return Math.max(0, Math.ceil((end - Date.now() - serverSkewMs) / 1000))
  })

  React.useEffect(() => {
    const end = parseIso(reservationExpiresAtIso)
    if (!Number.isFinite(end)) return

    const tick = () => {
      const sec = Math.max(0, Math.ceil((end - Date.now() - serverSkewMs) / 1000))
      setRemainingSec(sec)
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [reservationExpiresAtIso, serverSkewMs])

  const m = Math.floor(remainingSec / 60)
  const s = remainingSec % 60
  const display = `${m}:${String(s).padStart(2, "0")}`
  const urgent = remainingSec > 0 && remainingSec <= 60

  return (
    <div className={cn("space-y-1", className)} role="timer" aria-live="polite" aria-atomic="true">
      <p className={cxSummaryStrong(appearance)}>Lefoglalt készlet</p>
      <p
        className={cn(
          cxSummaryMuted(appearance),
          urgent && appearance === "dark" && "text-amber-300",
          urgent && appearance === "light" && "text-amber-700 font-semibold"
        )}
      >
        A kosár tartalma legfeljebb <span className="font-mono tabular-nums">{display}</span> ideig van lefoglalva.
        Fejezd be a fizetést a Stripe oldalon időben.
      </p>
    </div>
  )
}
