"use client"

import * as React from "react"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { cn } from "@wse/core/lib/utils"
import {
  type CheckoutStepAppearance,
  cxInput,
  cxLabel,
  cxTypeToggleBtn,
  cxTypeToggleShell,
} from "@wse/core/components/checkout/checkout-appearance"
import { CheckoutCountryPicker, type TradingLimits } from "@wse/core/components/checkout/CheckoutCountryPicker"
import { TradingLimitsContactNote } from "@wse/core/components/checkout/TradingLimitsContactNote"
import { getCountryDisplayName } from "@wse/core/lib/country-codes"

type BillingStepData = {
  type: "personal" | "company"
  name: string
  taxNumber: string
  countryCode: string
  country: string
  city: string
  zip: string
  street: string
  email: string
  phone: string
}

interface BillingStepProps {
  data: BillingStepData
  onChange: (data: BillingStepData) => void
  tradingLimits?: TradingLimits | null
  errors?: Partial<Record<"name" | "taxNumber" | "zip" | "city" | "street" | "email" | "phone", boolean>>
  /** @default "dark" */
  appearance?: CheckoutStepAppearance
}

export function BillingStep({
  data,
  onChange,
  tradingLimits = null,
  errors = {},
  appearance = "dark",
}: BillingStepProps) {
  const handleChange = <TField extends keyof BillingStepData>(field: TField, value: BillingStepData[TField]) => {
    onChange({ ...data, [field]: value })
  }
  const a = appearance
  const fieldClass = cn(cxInput(a), a === "dark" && "shadow-none dark:bg-transparent")
  const inputClass = (field: keyof NonNullable<BillingStepProps["errors"]>) =>
    cn(fieldClass, errors[field] && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30")

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 sm:space-y-8">
      <div className={cxTypeToggleShell(a)}>
        <button
          type="button"
          onClick={() => handleChange("type", "personal")}
          className={cxTypeToggleBtn(a, data.type === "personal")}
        >
          Magánszemély
        </button>
        <button
          type="button"
          onClick={() => handleChange("type", "company")}
          className={cxTypeToggleBtn(a, data.type === "company")}
        >
          Cég
        </button>
      </div>

      <TradingLimitsContactNote limits={tradingLimits} kind="billing" appearance={a} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <CheckoutCountryPicker
          id="checkout-billing-country"
          className="md:col-span-2"
          valueCode={data.countryCode || "HU"}
          limits={tradingLimits}
          kind="billing"
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
          <Label className={cxLabel(a)}>Név / Cégnév</Label>
          <Input
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Név / Cégnév"
            aria-invalid={errors.name || undefined}
            className={inputClass("name")}
          />
        </div>

        {data.type === "company" && (
          <div className="space-y-2 md:col-span-2">
            <Label className={cxLabel(a)}>Adószám</Label>
            <Input
              value={data.taxNumber}
              onChange={(e) => handleChange("taxNumber", e.target.value)}
              placeholder="Adószám"
              aria-invalid={errors.taxNumber || undefined}
              className={inputClass("taxNumber")}
            />
          </div>
        )}

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
          <Label className={cxLabel(a)}>Utca, házszám, emelet/ajtó</Label>
          <Input
            value={data.street}
            onChange={(e) => handleChange("street", e.target.value)}
            placeholder="Utca, házszám, emelet/ajtó"
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
    </div>
  )
}
