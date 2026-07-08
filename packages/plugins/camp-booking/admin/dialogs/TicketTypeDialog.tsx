"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import type { AdminTicketType } from "../camp-api"
import {
  CampAdminField,
  CampAdminInput,
  campAdminSelectClass,
} from "../camp-admin-ui"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  initial?: Partial<AdminTicketType>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function TicketTypeDialog({ open, onOpenChange, title, initial, onSubmit }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [priceHuf, setPriceHuf] = useState(0)
  const [pricingMode, setPricingMode] = useState<"per_child" | "flat">("per_child")
  const [kind, setKind] = useState<"base" | "addon">("base")
  const [earlyBirdEndsAt, setEarlyBirdEndsAt] = useState("")
  const [earlyBirdPriceHuf, setEarlyBirdPriceHuf] = useState("")
  const [earlyBirdDiscountPercent, setEarlyBirdDiscountPercent] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? "")
    setDescription(initial?.description ?? "")
    setPriceHuf(initial?.priceHuf ?? 0)
    setPricingMode(initial?.pricingMode ?? "per_child")
    setKind(initial?.kind ?? "base")
    setEarlyBirdEndsAt(
      initial?.earlyBirdEndsAt ? initial.earlyBirdEndsAt.slice(0, 16) : ""
    )
    setEarlyBirdPriceHuf(
      initial?.earlyBirdPriceHuf != null ? String(initial.earlyBirdPriceHuf) : ""
    )
    setEarlyBirdDiscountPercent(
      initial?.earlyBirdDiscountPercent != null
        ? String(initial.earlyBirdDiscountPercent)
        : ""
    )
    setIsActive(initial?.isActive !== false)
  }, [open, initial])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name,
        description,
        priceHuf: Number(priceHuf),
        pricingMode,
        kind,
        isActive,
        earlyBirdEndsAt: earlyBirdEndsAt ? new Date(earlyBirdEndsAt).toISOString() : null,
        earlyBirdPriceHuf: earlyBirdPriceHuf !== "" ? Number(earlyBirdPriceHuf) : null,
        earlyBirdDiscountPercent:
          earlyBirdDiscountPercent !== "" ? Number(earlyBirdDiscountPercent) : null,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white rounded-none sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black uppercase italic tracking-wider text-white">
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-6 py-4">
          <CampAdminField label="Név">
            <CampAdminInput value={name} onChange={(e) => setName(e.target.value)} required />
          </CampAdminField>
          <CampAdminField label="Leírás (vásárlói felületen)">
            <CampAdminInput value={description} onChange={(e) => setDescription(e.target.value)} />
          </CampAdminField>
          <div className="grid gap-6 sm:grid-cols-2">
            <CampAdminField label="Listaár (Ft)">
              <CampAdminInput
                type="number"
                min={0}
                value={priceHuf}
                onChange={(e) => setPriceHuf(Number(e.target.value))}
                required
              />
            </CampAdminField>
            <CampAdminField label="Árazás">
              <select
                className={campAdminSelectClass}
                value={pricingMode}
                onChange={(e) => setPricingMode(e.target.value as "per_child" | "flat")}
              >
                <option value="per_child">Gyerekenként</option>
                <option value="flat">Egyszeri (flat)</option>
              </select>
            </CampAdminField>
            <CampAdminField label="Típus">
              <select
                className={campAdminSelectClass}
                value={kind}
                onChange={(e) => setKind(e.target.value as "base" | "addon")}
              >
                <option value="base">Táborjegy (alap)</option>
                <option value="addon">Kiegészítő (pl. laptop)</option>
              </select>
            </CampAdminField>
            <label className="flex items-end gap-3 pb-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 accent-primary"
              />
              Aktív
            </label>
          </div>
          {kind === "base" ? (
            <div className="border-t border-white/10 pt-6 space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-sky-300">Early bird</p>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Ha külön early bird és normál jegytípusod van, az early bird vége után a normál jegy
                automatikusan megjelenik a foglalásnál (a normál jegy legyen aktív). Egyetlen jegynél
                a fix ár vagy százalék a határidőig érvényes.
              </p>
              <CampAdminField label="Early bird vége">
                <CampAdminInput
                  type="datetime-local"
                  value={earlyBirdEndsAt}
                  onChange={(e) => setEarlyBirdEndsAt(e.target.value)}
                />
              </CampAdminField>
              <div className="grid gap-6 sm:grid-cols-2">
                <CampAdminField label="Fix early bird ár (Ft)">
                  <CampAdminInput
                    type="number"
                    min={0}
                    placeholder="Üres = százalék"
                    value={earlyBirdPriceHuf}
                    onChange={(e) => setEarlyBirdPriceHuf(e.target.value)}
                  />
                </CampAdminField>
                <CampAdminField label="Early bird kedvezmény (%)">
                  <CampAdminInput
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Ha nincs fix ár"
                    value={earlyBirdDiscountPercent}
                    onChange={(e) => setEarlyBirdDiscountPercent(e.target.value)}
                  />
                </CampAdminField>
              </div>
            </div>
          ) : null}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="krausz"
              disabled={saving || !name}
              className="flex-1 h-11 uppercase tracking-widest text-[10px] font-black"
            >
              {saving ? "Mentés…" : "Mentés"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 border-white/10 text-white rounded-none"
            >
              Mégse
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
