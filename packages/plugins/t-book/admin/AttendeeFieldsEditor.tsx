"use client"

import { Button } from "@wse/core/components/ui/button"
import type { TBookAttendeeFieldDef, TBookAttendeeFieldType } from "../lib/attendee-fields"
import {
  assignAttendeeFieldKeys,
  FIELD_TYPE_LABELS,
  tournamentAttendeeFieldPreset,
} from "../lib/attendee-fields"
import { TBookField, TBookInput, TBookSelect } from "./t-book-admin-ui"

function ChoicesEditor({
  choices,
  onChange,
}: {
  choices: NonNullable<TBookAttendeeFieldDef["choices"]>
  onChange: (choices: NonNullable<TBookAttendeeFieldDef["choices"]>) => void
}) {
  return (
    <div className="space-y-2">
      {choices.map((choice, index) => (
        <div key={index} className="flex gap-2">
          <TBookInput
            className="flex-1"
            placeholder="Megnevezés (pl. Magyarország)"
            value={choice.label}
            onChange={(e) =>
              onChange(choices.map((c, i) => (i === index ? { ...c, label: e.target.value } : c)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            className="h-10 text-red-600"
            onClick={() => onChange(choices.filter((_, i) => i !== index))}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-8 text-xs"
        onClick={() => onChange([...choices, { value: "", label: "" }])}
      >
        + Lehetőség
      </Button>
    </div>
  )
}

export function AttendeeFieldsEditor({
  fields,
  onChange,
}: {
  fields: TBookAttendeeFieldDef[]
  onChange: (fields: TBookAttendeeFieldDef[]) => void
}) {
  const update = (index: number, patch: Partial<TBookAttendeeFieldDef>) => {
    const next = fields.map((field, i) => (i === index ? { ...field, ...patch } : field))
    onChange(assignAttendeeFieldKeys(next))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= fields.length) return
    const next = [...fields]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(assignAttendeeFieldKeys(next.map((field, i) => ({ ...field, sortOrder: i }))))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-2">
        <p>
          Ezeket az adatokat <strong className="text-foreground">minden jegyet foglaló résztvevőtől</strong>{" "}
          külön kell megadni (pl. név, életkor, állampolgárság). A foglaló kapcsolattartó adatait a
          vendég a foglalási űrlap „Kapcsolattartó” részén adja meg.
        </p>
        <p>Ha több jegyet foglalnak, minden résztvevőhöz külön sor készül.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 text-xs"
          onClick={() => onChange(tournamentAttendeeFieldPreset())}
        >
          Verseny sablon (név, e-mail, születési év, állampolgárság)
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-6 text-center">
          Nincs egyedi résztvevői mező — csak a kapcsolattartó adatai kerülnek rögzítésre.
        </p>
      ) : null}

      {fields.map((field, index) => (
        <div key={index} className="rounded-xl bg-card shadow-sm p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <TBookField label="Mező neve (vendég látja)">
                <TBookInput
                  value={field.label}
                  onChange={(e) => update(index, { label: e.target.value })}
                  placeholder="pl. Állampolgárság"
                />
              </TBookField>
              <TBookField label="Típus">
                <TBookSelect
                  value={field.type}
                  onChange={(e) => {
                    const type = e.target.value as TBookAttendeeFieldType
                    update(index, {
                      type,
                      choices: type === "select" ? (field.choices ?? []) : undefined,
                    })
                  }}
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </TBookSelect>
              </TBookField>
            </div>
            <div className="flex gap-1 shrink-0 pt-5">
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground"
                disabled={index === fields.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600"
                onClick={() => onChange(fields.filter((_, i) => i !== index))}
              >
                ✕
              </Button>
            </div>
          </div>

          <TBookField label="Súgó szöveg (opcionális)">
            <TBookInput
              value={field.helpText ?? ""}
              onChange={(e) => update(index, { helpText: e.target.value })}
              placeholder="pl. A verseny szabályzata szerint"
            />
          </TBookField>

          {field.type === "select" ? (
            <TBookField label="Választható értékek">
              <ChoicesEditor
                choices={field.choices ?? []}
                onChange={(choices) => update(index, { choices })}
              />
            </TBookField>
          ) : null}

          {field.type === "number" ? (
            <div className="grid grid-cols-2 gap-3">
              <TBookField label="Minimum">
                <TBookInput
                  type="number"
                  value={field.min ?? ""}
                  onChange={(e) =>
                    update(index, {
                      min: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </TBookField>
              <TBookField label="Maximum">
                <TBookInput
                  type="number"
                  value={field.max ?? ""}
                  onChange={(e) =>
                    update(index, {
                      max: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </TBookField>
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={Boolean(field.required)}
              onChange={(e) => update(index, { required: e.target.checked })}
            />
            Kötelező mező
          </label>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="h-10 font-bold"
        onClick={() =>
          onChange(
            assignAttendeeFieldKeys([
              ...fields,
              {
                key: "",
                label: "",
                type: "text",
                required: false,
                sortOrder: fields.length,
              },
            ])
          )
        }
      >
        + Résztvevői mező
      </Button>
    </div>
  )
}
