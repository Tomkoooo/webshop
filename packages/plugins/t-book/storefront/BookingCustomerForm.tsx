"use client"

import { tBookCustomerSchema } from "../lib/schemas"
import { zodFieldErrors } from "./BookingBillingForm"
import { tbookT } from "../lib/i18n"

export type CustomerFormState = {
  name: string
  email: string
  phone: string
  note: string
}

export type CustomerFieldKey = "name" | "email" | "phone" | "note"
export type CustomerFieldErrors = Partial<Record<CustomerFieldKey, string>>

export function emptyCustomerForm(): CustomerFormState {
  return { name: "", email: "", phone: "", note: "" }
}

export function validateCustomerForm(customer: CustomerFormState): CustomerFieldErrors {
  return zodFieldErrors(tBookCustomerSchema, customer) as CustomerFieldErrors
}

export function isCustomerFormValid(customer: CustomerFormState): boolean {
  return tBookCustomerSchema.safeParse(customer).success
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <span id={id} className="block text-xs text-destructive" role="alert">
      {message}
    </span>
  )
}

export function BookingCustomerForm({
  customer,
  onChange,
  inputClassName,
  errors = {},
  heading,
  hint,
  locale,
}: {
  customer: CustomerFormState
  onChange: (customer: CustomerFormState) => void
  inputClassName: string
  errors?: CustomerFieldErrors
  heading: string
  hint?: string
  locale?: string
}) {
  const patch = (partial: Partial<CustomerFormState>) => onChange({ ...customer, ...partial })

  const fieldClass = (key: CustomerFieldKey) =>
    errors[key] ? `${inputClassName} border-destructive` : inputClassName

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{heading}</h2>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1" htmlFor="customer-name">
          <span className="text-sm font-medium">{tbookT(locale, "nameLabel")}</span>
          <input
            id="customer-name"
            className={fieldClass("name")}
            value={customer.name}
            onChange={(e) => patch({ name: e.target.value })}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "customer-name-error" : undefined}
            autoComplete="name"
          />
          <FieldError id="customer-name-error" message={errors.name} />
        </label>
        <label className="block space-y-1" htmlFor="customer-email">
          <span className="text-sm font-medium">{tbookT(locale, "emailLabel")}</span>
          <input
            id="customer-email"
            className={fieldClass("email")}
            type="email"
            value={customer.email}
            onChange={(e) => patch({ email: e.target.value })}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "customer-email-error" : undefined}
            autoComplete="email"
          />
          <FieldError id="customer-email-error" message={errors.email} />
        </label>
        <label className="block space-y-1 sm:col-span-2" htmlFor="customer-phone">
          <span className="text-sm font-medium">{tbookT(locale, "phoneLabel")}</span>
          <input
            id="customer-phone"
            className={fieldClass("phone")}
            type="tel"
            value={customer.phone}
            onChange={(e) => patch({ phone: e.target.value })}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "customer-phone-error" : undefined}
            autoComplete="tel"
          />
          <FieldError id="customer-phone-error" message={errors.phone} />
        </label>
        <label className="block space-y-1 sm:col-span-2" htmlFor="customer-note">
          <span className="text-sm font-medium">{tbookT(locale, "noteLabelOptional")}</span>
          <textarea
            id="customer-note"
            className={errors.note ? `${inputClassName} border-destructive` : inputClassName}
            rows={2}
            value={customer.note}
            onChange={(e) => patch({ note: e.target.value })}
            aria-invalid={errors.note ? true : undefined}
            aria-describedby={errors.note ? "customer-note-error" : undefined}
          />
          <FieldError id="customer-note-error" message={errors.note} />
        </label>
      </div>
    </div>
  )
}
