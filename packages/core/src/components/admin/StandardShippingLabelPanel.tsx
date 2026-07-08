"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RotateCcw, Download, Printer } from "lucide-react"
import { toast } from "sonner"
import { generateStandardShippingLabel } from "@wse/core/actions/admin-orders"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

type StandardShippingLabelPanelProps = {
  orderId: string
  standardShippingLabel?: {
    status?: string
    generatedAt?: string
    lastError?: string
  } | null
  onUpdated: () => void
}

export function StandardShippingLabelPanel({
  orderId,
  standardShippingLabel,
  onUpdated,
}: StandardShippingLabelPanelProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const isGenerating = standardShippingLabel?.status === "generating"
  const hasLabel = standardShippingLabel?.status === "ready"
  const labelUrl = `/api/admin/orders/${orderId}/standard-shipping-label`

  const handleGenerate = async () => {
    if (generating || isGenerating) return
    setGenerating(true)
    try {
      const result = await generateStandardShippingLabel(orderId)
      if (result.success) {
        toast.success(hasLabel ? "Szállítási címke újragenerálva." : "Szállítási címke PDF elkészült.")
        onUpdated()
        router.refresh()
      } else {
        toast.error(result.error || "A címke generálása sikertelen.")
        onUpdated()
      }
    } catch {
      toast.error("A címke generálása sikertelen.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
        Webshop / házhozszállítás — PDF címke a feladó és címzett adataival
      </p>

      {standardShippingLabel?.lastError ? (
        <p className="text-sm text-rose-400">{standardShippingLabel.lastError}</p>
      ) : null}

      {isGenerating ? (
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
          <LoadingSpinner size="xs" />
          Címke generálás folyamatban…
        </p>
      ) : null}

      {hasLabel && standardShippingLabel?.generatedAt ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Címke kész — {new Date(standardShippingLabel.generatedAt).toLocaleString("hu-HU")}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!hasLabel ? (
          <Button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating || isGenerating}
            className="h-10 rounded-none bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
          >
            {generating || isGenerating ? (
              <LoadingSpinner size="xs" className="mr-2" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Címke generálása
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleGenerate()}
            disabled={generating || isGenerating}
            className="h-10 rounded-none border-emerald-500/30 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10"
          >
            {generating || isGenerating ? (
              <LoadingSpinner size="xs" className="mr-2" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            PDF újragenerálás
          </Button>
        )}

        {hasLabel ? (
          <Button
            type="button"
            variant="outline"
            asChild
            className="h-10 rounded-none border-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-neutral-200"
          >
            <Link href={labelUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              PDF letöltés
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
