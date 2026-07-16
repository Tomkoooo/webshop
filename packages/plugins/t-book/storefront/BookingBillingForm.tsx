"use client"

import type { TBookBillingType } from "../lib/schemas"

export type BillingFormState = {
  billingType: TBookBillingType
  name: string
  zip: string
  city: string
  street: string
  countryCode: string
  taxNumber: string
}

const BILLING_TYPE_LABELS: Record<TBookBillingType, string> = {
  personal: "Personal",
  company: "Company / business",
  sport: "Sports club / organisation",
}

export function emptyBillingForm(customerName = ""): BillingFormState {
  return {
    billingType: "personal",
    name: customerName,
    zip: "",
    city: "",
    street: "",
    countryCode: "HU",
    taxNumber: "",
  }
}

export function isBillingFormValid(billing: BillingFormState): boolean {
  if (!billing.name.trim() || !billing.zip.trim() || !billing.city.trim() || !billing.street.trim()) {
    return false
  }
  if (billing.billingType === "company" && !billing.taxNumber.trim()) return false
  return true
}

export function BookingBillingForm({
  billing,
  onChange,
  inputClassName,
}: {
  billing: BillingFormState
  onChange: (billing: BillingFormState) => void
  inputClassName: string
}) {
  const patch = (partial: Partial<BillingFormState>) => onChange({ ...billing, ...partial })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Billing details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Used for the invoice after successful payment.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Invoice type</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BILLING_TYPE_LABELS) as TBookBillingType[]).map((type) => (
            <label
              key={type}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                billing.billingType === type
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name="billingType"
                className="sr-only"
                checked={billing.billingType === type}
                onChange={() => patch({ billingType: type })}
              />
              {BILLING_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">
            {billing.billingType === "personal" ? "Billing name" : "Organisation / company name"} *
          </span>
          <input
            className={inputClassName}
            value={billing.name}
            onChange={(e) => patch({ name: e.target.value })}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Postal code *</span>
          <input
            className={inputClassName}
            value={billing.zip}
            onChange={(e) => patch({ zip: e.target.value })}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">City *</span>
          <input
            className={inputClassName}
            value={billing.city}
            onChange={(e) => patch({ city: e.target.value })}
            required
          />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Street address *</span>
          <input
            className={inputClassName}
            value={billing.street}
            onChange={(e) => patch({ street: e.target.value })}
            required
          />
        </label>
        {billing.billingType === "company" ? (
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Tax number *</span>
            <input
              className={inputClassName}
              value={billing.taxNumber}
              onChange={(e) => patch({ taxNumber: e.target.value })}
              placeholder="12345678-1-23"
              required
            />
          </label>
        ) : billing.billingType === "sport" ? (
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Tax / registration number (optional)</span>
            <input
              className={inputClassName}
              value={billing.taxNumber}
              onChange={(e) => patch({ taxNumber: e.target.value })}
            />
          </label>
        ) : null}
      </div>
    </div>
  )
}
