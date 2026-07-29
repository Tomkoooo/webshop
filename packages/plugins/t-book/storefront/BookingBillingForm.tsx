"use client"

import { z } from "zod"
import {
  tBookBillingSchema,
  type TBookBillingType,
} from "../lib/schemas"
import { tbookT } from "../lib/i18n"

export type BillingFormState = {
  billingType: TBookBillingType
  name: string
  zip: string
  city: string
  street: string
  countryCode: string
  taxNumber: string
}

export type BillingFieldKey = "name" | "zip" | "city" | "street" | "taxNumber"
export type BillingFieldErrors = Partial<Record<BillingFieldKey, string>>

const BILLING_TYPE_KEYS: Record<TBookBillingType, "billingTypePersonal" | "billingTypeCompany" | "billingTypeSport"> = {
  personal: "billingTypePersonal",
  company: "billingTypeCompany",
  sport: "billingTypeSport",
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

/** Collect first Zod issue message per top-level field path. */
export function zodFieldErrors(
  schema: z.ZodTypeAny,
  value: unknown
): Record<string, string> {
  const parsed = schema.safeParse(value)
  if (parsed.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path[0]
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message
    }
  }
  return errors
}

export function validateBillingForm(billing: BillingFormState): BillingFieldErrors {
  return zodFieldErrors(tBookBillingSchema, billing) as BillingFieldErrors
}

export function isBillingFormValid(billing: BillingFormState): boolean {
  return tBookBillingSchema.safeParse(billing).success
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <span id={id} className="block text-xs text-destructive" role="alert">
      {message}
    </span>
  )
}

export function BookingBillingForm({
  billing,
  onChange,
  inputClassName,
  errors = {},
  locale,
}: {
  billing: BillingFormState
  onChange: (billing: BillingFormState) => void
  inputClassName: string
  errors?: BillingFieldErrors
  locale?: string
}) {
  const patch = (partial: Partial<BillingFormState>) => onChange({ ...billing, ...partial })

  const fieldClass = (key: BillingFieldKey) =>
    errors[key] ? `${inputClassName} border-destructive` : inputClassName

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{tbookT(locale, "billingDetails")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {tbookT(locale, "billingDetailsHint")}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{tbookT(locale, "invoiceType")}</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BILLING_TYPE_KEYS) as TBookBillingType[]).map((type) => (
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
              {tbookT(locale, BILLING_TYPE_KEYS[type])}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 sm:col-span-2" htmlFor="billing-name">
          <span className="text-sm font-medium">
            {tbookT(locale, billing.billingType === "personal" ? "billingName" : "organisationName")} *
          </span>
          <input
            id="billing-name"
            className={fieldClass("name")}
            value={billing.name}
            onChange={(e) => patch({ name: e.target.value })}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "billing-name-error" : undefined}
            autoComplete="name"
          />
          <FieldError id="billing-name-error" message={errors.name} />
        </label>
        <label className="block space-y-1" htmlFor="billing-zip">
          <span className="text-sm font-medium">{tbookT(locale, "postalCode")}</span>
          <input
            id="billing-zip"
            className={fieldClass("zip")}
            value={billing.zip}
            onChange={(e) => patch({ zip: e.target.value })}
            aria-invalid={errors.zip ? true : undefined}
            aria-describedby={errors.zip ? "billing-zip-error" : undefined}
            autoComplete="postal-code"
          />
          <FieldError id="billing-zip-error" message={errors.zip} />
        </label>
        <label className="block space-y-1" htmlFor="billing-city">
          <span className="text-sm font-medium">{tbookT(locale, "cityLabel")}</span>
          <input
            id="billing-city"
            className={fieldClass("city")}
            value={billing.city}
            onChange={(e) => patch({ city: e.target.value })}
            aria-invalid={errors.city ? true : undefined}
            aria-describedby={errors.city ? "billing-city-error" : undefined}
            autoComplete="address-level2"
          />
          <FieldError id="billing-city-error" message={errors.city} />
        </label>
        <label className="block space-y-1 sm:col-span-2" htmlFor="billing-street">
          <span className="text-sm font-medium">{tbookT(locale, "streetAddress")}</span>
          <input
            id="billing-street"
            className={fieldClass("street")}
            value={billing.street}
            onChange={(e) => patch({ street: e.target.value })}
            aria-invalid={errors.street ? true : undefined}
            aria-describedby={errors.street ? "billing-street-error" : undefined}
            autoComplete="street-address"
          />
          <FieldError id="billing-street-error" message={errors.street} />
        </label>
        {billing.billingType === "company" ? (
          <label className="block space-y-1 sm:col-span-2" htmlFor="billing-tax">
            <span className="text-sm font-medium">{tbookT(locale, "taxNumberRequired")}</span>
            <input
              id="billing-tax"
              className={fieldClass("taxNumber")}
              value={billing.taxNumber}
              onChange={(e) => patch({ taxNumber: e.target.value })}
              placeholder="12345678-1-23"
              aria-invalid={errors.taxNumber ? true : undefined}
              aria-describedby={errors.taxNumber ? "billing-tax-error" : undefined}
            />
            <FieldError id="billing-tax-error" message={errors.taxNumber} />
          </label>
        ) : billing.billingType === "sport" ? (
          <label className="block space-y-1 sm:col-span-2" htmlFor="billing-tax">
            <span className="text-sm font-medium">{tbookT(locale, "taxNumberOptional")}</span>
            <input
              id="billing-tax"
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
