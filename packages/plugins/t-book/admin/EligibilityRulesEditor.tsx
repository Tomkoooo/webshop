"use client"

import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"
import {
  ELIGIBILITY_OP_LABELS,
  type TBookEligibilityMatchOp,
  type TBookEligibilityRule,
  type TBookEligibilityRulesConfig,
} from "../lib/eligibility"
import { TBookField, TBookInput, tBookGhostButtonClass, TBookSelect } from "./t-book-admin-ui"

function opsForField(field: TBookAttendeeFieldDef | undefined): TBookEligibilityMatchOp[] {
  if (!field) return ["equals"]
  switch (field.type) {
    case "select":
      return ["equals", "not_equals", "in", "not_in"]
    case "date":
      return ["min_age", "max_age"]
    case "number":
      return ["min_age", "max_age", "min", "max", "equals"]
    case "email":
    case "phone":
    case "text":
      return ["equals", "not_equals", "contains"]
    default:
      return ["equals", "not_equals"]
  }
}

function chipClass(selected: boolean) {
  return `rounded-lg border px-3 py-2 text-sm transition-colors ${
    selected
      ? "border-primary bg-primary/10 font-medium text-foreground"
      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
  }`
}

function parseMultiValues(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function RuleValuePicker({
  field,
  op,
  value,
  onChange,
}: {
  field: TBookAttendeeFieldDef | undefined
  op: TBookEligibilityMatchOp
  value: string
  onChange: (value: string) => void
}) {
  if (!field) {
    return (
      <TBookInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Érték"
      />
    )
  }

  if (op === "min_age" || op === "max_age") {
    return (
      <div className="space-y-1">
        <TBookInput
          type="number"
          min={0}
          max={120}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={op === "max_age" ? "pl. 17 (18 alatt)" : "pl. 18"}
        />
        <p className="text-xs text-muted-foreground">
          Életkor az esemény kezdőnapján számítódik.
        </p>
      </div>
    )
  }

  if (op === "min" || op === "max") {
    return (
      <TBookInput
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Szám"
      />
    )
  }

  if (field.type === "select" && field.choices && field.choices.length > 0) {
    const multi = op === "in" || op === "not_in"
    const selected = multi ? parseMultiValues(value) : [value].filter(Boolean)

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Kattints a megjelenő opcióra — a rendszer a háttérértéket menti (nem kell tudnod a
          value-t).
        </p>
        <div className="flex flex-wrap gap-2">
          {field.choices.map((choice) => {
            const isOn = selected.includes(choice.value)
            return (
              <button
                key={choice.value || choice.label}
                type="button"
                className={chipClass(isOn)}
                aria-pressed={isOn}
                onClick={() => {
                  if (!multi) {
                    onChange(choice.value)
                    return
                  }
                  const next = isOn
                    ? selected.filter((v) => v !== choice.value)
                    : [...selected, choice.value]
                  onChange(next.join(","))
                }}
              >
                {choice.label || choice.value}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <TBookInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Érték"
    />
  )
}

export function EligibilityRulesEditor({
  fields,
  value,
  onChange,
}: {
  fields: TBookAttendeeFieldDef[]
  value: TBookEligibilityRulesConfig
  onChange: (next: TBookEligibilityRulesConfig) => void
}) {
  const updateRule = (index: number, patch: Partial<TBookEligibilityRule>) => {
    const rules = value.rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    onChange({ ...value, rules })
  }

  const addRule = () => {
    const first = fields[0]
    const defaultOp = opsForField(first)[0] ?? "equals"
    onChange({
      ...value,
      rules: [
        ...value.rules,
        {
          id: `rule-${Date.now()}`,
          fieldKey: first?.key || "",
          op: defaultOp,
          value: "",
          message: "",
        },
      ],
    })
  }

  if (fields.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Először add hozzá a foglalási űrlap mezőit (pl. Nem, Születési dátum), utána itt tudsz
        belépési szabályokat kattintással beállítani.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p>
          A szabálynak <strong className="text-foreground">teljesülnie kell</strong> a foglaláshoz.
        </p>
        <p>
          Példa — csak nők: mező <em>Nem</em> → <em>Legyen</em> → kattints <em>Nő</em> → hibaüzenet:
          „Only females can enter”.
        </p>
        <p>
          Példa — 18 alatt: születési dátum mező → <em>Maximum életkor</em> → <em>17</em>.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <TBookField label="Szabályok kapcsolata">
          <TBookSelect
            value={value.logic}
            onChange={(e) =>
              onChange({ ...value, logic: e.target.value as "and" | "or" })
            }
          >
            <option value="and">És (mind igaz)</option>
            <option value="or">Vagy (legalább egy igaz)</option>
          </TBookSelect>
        </TBookField>
        <button type="button" className={tBookGhostButtonClass} onClick={addRule}>
          Szabály hozzáadása
        </button>
      </div>

      {value.rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Még nincs szabály — adj hozzá egyet.</p>
      ) : null}

      {value.rules.map((rule, index) => {
        const field = fields.find((f) => f.key === rule.fieldKey)
        const allowedOps = opsForField(field)
        const op = allowedOps.includes(rule.op) ? rule.op : allowedOps[0]

        return (
          <div
            key={rule.id}
            className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TBookField label="Űrlapmező">
                <TBookSelect
                  value={rule.fieldKey}
                  onChange={(e) => {
                    const nextField = fields.find((f) => f.key === e.target.value)
                    const nextOps = opsForField(nextField)
                    updateRule(index, {
                      fieldKey: e.target.value,
                      op: nextOps[0] ?? "equals",
                      value: "",
                    })
                  }}
                >
                  <option value="">— válassz mezőt —</option>
                  {fields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label} · {f.type}
                    </option>
                  ))}
                </TBookSelect>
              </TBookField>

              <TBookField label="Feltétel">
                <TBookSelect
                  value={op}
                  onChange={(e) =>
                    updateRule(index, {
                      op: e.target.value as TBookEligibilityMatchOp,
                      value: "",
                    })
                  }
                >
                  {allowedOps.map((opKey) => (
                    <option key={opKey} value={opKey}>
                      {ELIGIBILITY_OP_LABELS[opKey]}
                    </option>
                  ))}
                </TBookSelect>
              </TBookField>
            </div>

            <TBookField label="Érték">
              <RuleValuePicker
                field={field}
                op={op}
                value={rule.value}
                onChange={(next) => updateRule(index, { value: next })}
              />
            </TBookField>

            <TBookField label="Hibaüzenet a vendégnek">
              <TBookInput
                value={rule.message || ""}
                onChange={(e) => updateRule(index, { message: e.target.value })}
                placeholder='pl. Only females can enter'
              />
            </TBookField>

            <button
              type="button"
              className={tBookGhostButtonClass}
              onClick={() =>
                onChange({
                  ...value,
                  rules: value.rules.filter((_, i) => i !== index),
                })
              }
            >
              Szabály törlése
            </button>
          </div>
        )
      })}
    </div>
  )
}
