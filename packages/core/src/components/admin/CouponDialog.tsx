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
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { cn } from "@wse/core/lib/utils"
import { adminInputClass } from "@wse/core/lib/admin-ui"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <form key={formKey} onSubmit={handleSubmit} className="space-y-6 py-2">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <AdminFormField label="Kuponkód" className="md:col-span-2">
              <Input
                name="code"
                required
                defaultValue={values.code}
                placeholder="Pl. SUMMER2024"
                className={cn(adminInputClass, "h-10 uppercase")}
              />
            </AdminFormField>

            <AdminFormField label="Típus" className="md:col-span-2">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/40 p-1 sm:grid-cols-4">
                {(["percentage", "fixed", "free_shipping", "product_price"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-md py-2.5 text-xs font-medium transition-colors",
                      type === t
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                    )}
                  >
                    {t === "percentage"
                      ? "Százalék"
                      : t === "fixed"
                        ? "Fix összeg"
                        : t === "free_shipping"
                          ? "Ingyenes szállítás"
                          : "Termékár"}
                  </button>
                ))}
              </div>
            </AdminFormField>

            {type !== "free_shipping" && type !== "product_price" && (
              <AdminFormField label="Érték">
                <Input
                  name="value"
                  type="number"
                  required
                  defaultValue={values.value}
                  placeholder="0"
                  className={cn(adminInputClass, "h-10")}
                />
              </AdminFormField>
            )}

            {type === "product_price" ? (
              <CouponProductRulesEditor rules={productPriceRules} onChange={setProductPriceRules} />
            ) : null}

            <AdminFormField label="Min. kosárérték">
              <Input
                name="minCartValue"
                type="number"
                defaultValue={values.minCartValue}
                placeholder="0"
                className={cn(adminInputClass, "h-10")}
              />
            </AdminFormField>

            <AdminFormField label="Kezdő dátum">
              <Input
                name="startDate"
                type="date"
                required
                defaultValue={formatDateInput(values.startDate)}
                className={cn(adminInputClass, "h-10")}
              />
            </AdminFormField>

            <AdminFormField label="Lejárat dátuma">
              <Input
                name="endDate"
                type="date"
                required
                defaultValue={formatDateInput(values.endDate)}
                className={cn(adminInputClass, "h-10")}
              />
            </AdminFormField>

            <AdminFormField label="Max. felhasználás (összesen)" hint="Üres = végtelen">
              <Input
                name="maxUses"
                type="number"
                min={1}
                defaultValue={values.maxUses ?? ""}
                placeholder="Üres = végtelen"
                className={cn(adminInputClass, "h-10")}
              />
            </AdminFormField>

            <AdminFormField label="Max. / e-mail cím" hint="Üres = végtelen">
              <Input
                name="maxUsesPerUser"
                type="number"
                min={1}
                defaultValue={values.maxUsesPerUser ?? ""}
                placeholder="Üres = végtelen"
                className={cn(adminInputClass, "h-10")}
              />
            </AdminFormField>

            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-4 md:col-span-2">
              <div>
                <p className="text-sm font-medium">Aktív</p>
                <p className="text-xs text-muted-foreground">A kupon használható a pénztárban</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "h-6 w-11 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "bg-primary" : "bg-muted"
                )}
                aria-pressed={isActive}
              >
                <div
                  className={cn(
                    "size-5 rounded-full bg-background shadow-sm transition-transform",
                    isActive ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Mentés…" : submitLabel ?? (isEdit ? "Kupon mentése" : "Kupon létrehozása")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
