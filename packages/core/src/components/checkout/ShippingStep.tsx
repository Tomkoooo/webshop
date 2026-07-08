"use client"

import * as React from "react"
import { CollapseReveal } from "@wse/core/components/motion/css-reveal"
import { Check } from "lucide-react"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { cn } from "@wse/core/lib/utils"
import {
  type CheckoutStepAppearance,
  cxInput,
  cxLabel,
  cxTextarea,
} from "@wse/core/components/checkout/checkout-appearance"
import { CheckoutCountryPicker, type TradingLimits } from "@wse/core/components/checkout/CheckoutCountryPicker"
import { TradingLimitsContactNote } from "@wse/core/components/checkout/TradingLimitsContactNote"
import { getCountryDisplayName } from "@wse/core/lib/country-codes"

type ShippingStepData = {
  isSameAsBilling: boolean
  name: string
  countryCode: string
  country: string
  city: string
  zip: string
  street: string
  comment: string
  email: string
  phone: string
}

interface ShippingStepProps {
  data: ShippingStepData
  onChange: (data: ShippingStepData) => void
  billingData: Pick<ShippingStepData, "countryCode" | "country">
  tradingLimits?: TradingLimits | null
  errors?: Partial<Record<"name" | "zip" | "city" | "street" | "email" | "phone", boolean>>
  /** @default "dark" */
  appearance?: CheckoutStepAppearance
}

export function ShippingStep({
  data,
  onChange,
  billingData,
  tradingLimits = null,
  errors = {},
  appearance = "dark",
}: ShippingStepProps) {
  const handleChange = <TField extends keyof ShippingStepData>(field: TField, value: ShippingStepData[TField]) => {
    onChange({ ...data, [field]: value })
  }
  const a = appearance
  const fieldClass = cn(cxInput(a), a === "dark" && "shadow-none dark:bg-transparent")
  const inputClass = (field: keyof NonNullable<ShippingStepProps["errors"]>) =>
    cn(fieldClass, errors[field] && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30")

  const toggleSameAsBilling = () => {
    const isNowSame = !data.isSameAsBilling
    if (isNowSame) {
      onChange({
        ...data,
        isSameAsBilling: true,
        countryCode: billingData.countryCode,
        country: billingData.country,
      })
    } else {
      handleChange("isSameAsBilling", false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 sm:space-y-10">
      <TradingLimitsContactNote limits={tradingLimits} kind="shipping" appearance={a} />

      <button type="button" onClick={toggleSameAsBilling} className="group flex cursor-pointer items-center gap-4">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center border-2 transition-all duration-300",
            data.isSameAsBilling
              ? "border-primary-foreground/35 bg-primary"
              : a === "light"
                ? "border-border bg-transparent group-hover:border-primary-foreground/50"
                : "border-white/20 bg-transparent group-hover:border-white/40"
          )}
        >
          {data.isSameAsBilling && <Check className="scale-in-center h-4 w-4 text-primary-foreground" />}
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.2em]",
            a === "light" ? "text-foreground" : "font-black text-white"
          )}
        >
          Megegyezik a számlázási adatokkal
        </span>
      </button>

      <CollapseReveal open={!data.isSameAsBilling}>
            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2 md:gap-8">
              <CheckoutCountryPicker
                id="checkout-shipping-country"
                className="md:col-span-2"
                valueCode={data.countryCode || "HU"}
                limits={tradingLimits}
                kind="shipping"
                appearance={a}
                onChangeCode={(code) =>
                  onChange({
                    ...data,
                    countryCode: code,
                    country: getCountryDisplayName(code, "hu-HU"),
                  })
                }
              />
              <div className="space-y-2 md:col-span-2">
                <Label className={cxLabel(a)}>Átvevő neve</Label>
                <Input
                  value={data.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Átvevő neve"
                  aria-invalid={errors.name || undefined}
                  className={inputClass("name")}
                />
              </div>

              <div className="space-y-2">
                <Label className={cxLabel(a)}>Irányítószám</Label>
                <Input
                  value={data.zip}
                  onChange={(e) => handleChange("zip", e.target.value)}
                  placeholder="Irányítószám"
                  aria-invalid={errors.zip || undefined}
                  className={inputClass("zip")}
                />
              </div>

              <div className="space-y-2">
                <Label className={cxLabel(a)}>Város</Label>
                <Input
                  value={data.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Város"
                  aria-invalid={errors.city || undefined}
                  className={inputClass("city")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className={cxLabel(a)}>Utca, házszám</Label>
                <Input
                  value={data.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  placeholder="Utca, házszám"
                  aria-invalid={errors.street || undefined}
                  className={inputClass("street")}
                />
              </div>

              <div className="space-y-2">
                <Label className={cxLabel(a)}>E-mail</Label>
                <Input
                  type="email"
                  value={data.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="E-mail"
                  aria-invalid={errors.email || undefined}
                  className={inputClass("email")}
                />
              </div>

              <div className="space-y-2">
                <Label className={cxLabel(a)}>Telefonszám</Label>
                <Input
                  value={data.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Telefonszám"
                  aria-invalid={errors.phone || undefined}
                  className={inputClass("phone")}
                />
              </div>
            </div>
      </CollapseReveal>

      <div className="space-y-2">
        <Label className={cxLabel(a)}>Megjegyzés a futárnak (opcionális)</Label>
        <textarea
          value={data.comment}
          onChange={(e) => handleChange("comment", e.target.value)}
          rows={3}
          placeholder={a === "light" ? "Részletek a szállításhoz…" : "RÉSZLETEK A SZÁLLÍTÁSHOZ..."}
          className={cxTextarea(a)}
        />
      </div>
    </div>
  )
}
