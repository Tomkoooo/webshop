"use client"

import type {
  TBookPublicAttendeeFieldDef,
  TBookPublicOptionDef,
} from "./tbook-public-api"
import { formatHuf } from "./tbook-public-api"
import type { TBookSelections } from "./tbook-public-api"

export function optionVisible(option: TBookPublicOptionDef, selections: TBookSelections): boolean {
  if (!option.dependsOn) return true
  const current = selections[option.dependsOn.key]
  if (current == null) return false
  if (typeof current === "object" && !Array.isArray(current)) return false
  const values = Array.isArray(current) ? current.map(String) : [String(current)]
  return option.dependsOn.values.some((v) => values.includes(v))
}

export function selectionOptionValue(
  selections: TBookSelections,
  key: string
): string | number | boolean | string[] | undefined {
  const value = selections[key]
  if (value != null && typeof value === "object" && !Array.isArray(value)) return undefined
  return value as string | number | boolean | string[] | undefined
}

export function BookingOptionField({
  option,
  value,
  onChange,
  visible,
  inputClassName = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm",
}: {
  option: TBookPublicOptionDef
  value: string | number | boolean | string[] | undefined
  onChange: (v: string | number | boolean | string[]) => void
  visible: boolean
  inputClassName?: string
}) {
  if (!visible) return null

  const id = `opt-${option.key}`

  if (option.type === "select") {
    return (
      <label className="block space-y-1.5" htmlFor={id}>
        <span className="text-sm font-medium text-foreground">
          {option.label}
          {option.required ? " *" : ""}
        </span>
        <select
          id={id}
          className={inputClassName}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {!option.required ? <option value="">—</option> : null}
          {option.choices?.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
              {c.priceHuf ? ` (+${formatHuf(c.priceHuf)})` : ""}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (option.type === "checkbox") {
    return (
      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          id={id}
          type="checkbox"
          className="mt-1 rounded border-border"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {option.label}
          {option.unitPriceHuf ? ` (+${formatHuf(option.unitPriceHuf)})` : ""}
        </span>
      </label>
    )
  }

  if (option.type === "number") {
    return (
      <label className="block space-y-1.5" htmlFor={id}>
        <span className="text-sm font-medium text-foreground">{option.label}</span>
        <input
          id={id}
          type="number"
          min={option.min}
          max={option.max}
          className={inputClassName}
          value={typeof value === "number" ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    )
  }

  return null
}

export function AttendeeFieldInput({
  field,
  value,
  onChange,
  inputClassName = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm",
}: {
  field: TBookPublicAttendeeFieldDef
  value: string | number | undefined
  onChange: (value: string | number) => void
  inputClassName?: string
}) {
  const id = `attendee-${field.key}`
  const label = (
    <span className="text-sm font-medium text-foreground">
      {field.label}
      {field.required ? " *" : ""}
    </span>
  )

  if (field.type === "select") {
    return (
      <label className="block space-y-1.5" htmlFor={id}>
        {label}
        <select
          id={id}
          className={inputClassName}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {!field.required ? <option value="">—</option> : null}
          {field.choices?.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  const inputType =
    field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"

  return (
    <label className="block space-y-1.5" htmlFor={id}>
      {label}
      {field.helpText ? <span className="block text-xs text-muted-foreground">{field.helpText}</span> : null}
      <input
        id={id}
        type={inputType}
        min={field.min}
        max={field.max}
        className={inputClassName}
        value={value ?? ""}
        onChange={(e) =>
          onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
        }
      />
    </label>
  )
}

export function BookingStepIndicator({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-4" aria-label="Foglalási lépések">
      {steps.map((label, index) => {
        const step = index + 1
        const active = step === current
        const done = step < current
        return (
          <li
            key={label}
            className={`flex items-center gap-2 text-sm ${
              active ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground"
            }`}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
