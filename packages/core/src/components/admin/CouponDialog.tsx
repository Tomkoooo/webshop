"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { cn } from "@wse/core/lib/utils"
import {
  CouponProductRulesEditor,
  type CouponProductRuleDraft,
} from "@wse/core/components/admin/CouponProductRulesEditor"

type CouponType = "percentage" | "fixed" | "free_shipping" | "product_price"

export type CouponFormValues = {
  code: string
  type: CouponType
  value: number
  minCartValue: number
  startDate: string
  endDate: string
  maxUses: number | null
  maxUsesPerUser: number | null
  isActive: boolean
  productPriceRules?: CouponProductRuleDraft[]
}

function formatDateInput(value?: string | Date | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function emptyFormValues(): CouponFormValues {
  return {
    code: "",
    type: "percentage",
    value: 0,
    minCartValue: 0,
    startDate: "",
    endDate: "",
    maxUses: null,
    maxUsesPerUser: null,
    isActive: true,
    productPriceRules: [],
  }
}

interface CouponDialogProps {
  children: React.ReactNode
  title: string
  submitLabel?: string
  action: (data: any) => Promise<void>
  initialValues?: CouponFormValues
}

export function CouponDialog({
  children,
  title,
  submitLabel,
  action,
  initialValues,
}: CouponDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [type, setType] = React.useState<CouponType>("percentage")
  const [isActive, setIsActive] = React.useState(true)
  const [productPriceRules, setProductPriceRules] = React.useState<CouponProductRuleDraft[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const isEdit = Boolean(initialValues?.code)

  React.useEffect(() => {
    if (!open) return
    const values = initialValues ?? emptyFormValues()
    setType(values.type)
    setIsActive(values.isActive)
    setProductPriceRules(values.productPriceRules ?? [])
    setError(null)
  }, [open, initialValues])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)

    const data = {
      code: (formData.get("code") as string).toUpperCase(),
      type,
      value:
        type === "free_shipping" || type === "product_price"
          ? 0
          : parseFloat(formData.get("value") as string),
      minCartValue: parseFloat(formData.get("minCartValue") as string) || 0,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      maxUses: parseInt(formData.get("maxUses") as string) || null,
      maxUsesPerUser: parseInt(formData.get("maxUsesPerUser") as string) || null,
      isActive,
      productPriceRules:
        type === "product_price"
          ? productPriceRules.map((rule) => ({
              product: rule.product,
              variantId: rule.variantId || null,
              mode: rule.mode,
              value: rule.value,
            }))
          : undefined,
    }

    try {
      await action(data)
      setOpen(false)
      if (!isEdit) {
        setProductPriceRules([])
        setType("percentage")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba a kupon mentésekor")
    } finally {
      setSubmitting(false)
    }
  }

  const values = initialValues ?? emptyFormValues()
  const formKey = `${values.code || "new"}-${open ? "open" : "closed"}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-black border-white/10 text-white rounded-none sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black uppercase italic tracking-wider text-white">
            {title}
          </DialogTitle>
        </DialogHeader>
        <form key={formKey} onSubmit={handleSubmit} className="space-y-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Kuponkód</Label>
              <Input
                name="code"
                required
                defaultValue={values.code}
                placeholder="PL. SUMMER2024"
                className="bg-black border-white/5 h-12 text-white font-black uppercase tracking-[0.3em] focus-visible:ring-primary rounded-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Típus</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-white/5 border border-white/10">
                {(["percentage", "fixed", "free_shipping", "product_price"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "py-3 text-[8px] font-black uppercase tracking-widest transition-all",
                      type === t ? "bg-primary text-white" : "text-neutral-500 hover:text-white"
                    )}
                  >
                    {t === "percentage"
                      ? "%"
                      : t === "fixed"
                        ? "FT"
                        : t === "free_shipping"
                          ? "SZÁLLÍTÁS"
                          : "TERMÉKÁR"}
                  </button>
                ))}
              </div>
            </div>

            {type !== "free_shipping" && type !== "product_price" && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Érték</Label>
                <Input
                  name="value"
                  type="number"
                  required
                  defaultValue={values.value}
                  placeholder="0"
                  className="bg-black border-white/5 h-12 text-white font-black tracking-widest focus-visible:ring-primary rounded-none"
                />
              </div>
            )}

            {type === "product_price" ? (
              <CouponProductRulesEditor rules={productPriceRules} onChange={setProductPriceRules} />
            ) : null}

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Min. Kosárérték</Label>
              <Input
                name="minCartValue"
                type="number"
                defaultValue={values.minCartValue}
                placeholder="0"
                className="bg-black border-white/5 h-12 text-white font-black tracking-widest focus-visible:ring-primary rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Kezdő dátum</Label>
              <Input
                name="startDate"
                type="date"
                required
                defaultValue={formatDateInput(values.startDate)}
                className="bg-black border-white/5 h-12 text-white font-bold tracking-widest focus-visible:ring-primary rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Lejárat dátuma</Label>
              <Input
                name="endDate"
                type="date"
                required
                defaultValue={formatDateInput(values.endDate)}
                className="bg-black border-white/5 h-12 text-white font-bold tracking-widest focus-visible:ring-primary rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Max. Felhasználás (összesen)</Label>
              <Input
                name="maxUses"
                type="number"
                min={1}
                defaultValue={values.maxUses ?? ""}
                placeholder="Üres = végtelen"
                className="bg-black border-white/5 h-12 text-white font-black tracking-widest focus-visible:ring-primary rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Max. / e-mail cím</Label>
              <Input
                name="maxUsesPerUser"
                type="number"
                min={1}
                defaultValue={values.maxUsesPerUser ?? ""}
                placeholder="Üres = végtelen"
                className="bg-black border-white/5 h-12 text-white font-black tracking-widest focus-visible:ring-primary rounded-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 self-end h-12 md:col-span-2">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">AKTÍV</p>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "w-12 h-6 rounded-none p-1 transition-colors duration-200 focus:outline-none",
                  isActive ? "bg-primary" : "bg-neutral-800"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 bg-white transition-transform duration-200",
                    isActive ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {error ? (
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>
          ) : null}

          <div className="pt-4">
            <Button type="submit" variant="krausz" className="w-full h-14 tracking-[0.2em]" disabled={submitting}>
              {submitting ? "MENTÉS…" : submitLabel ?? (isEdit ? "KUPON MENTÉSE" : "KUPON LÉTREHOZÁSA")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
