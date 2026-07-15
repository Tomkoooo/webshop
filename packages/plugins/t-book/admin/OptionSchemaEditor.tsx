"use client"

import { Button } from "@wse/core/components/ui/button"
import type {
  TBookOptionChoice,
  TBookOptionDef,
  TBookOptionType,
  TBookPriceMode,
  TBookRoomType,
} from "../lib/pricing-types"
import { ROOM_TYPE_SELECTION_KEY } from "../lib/hotel-pricing"
import { tBookEmptyStateClass, TBookField, TBookInput, TBookSelect } from "./t-book-admin-ui"

const PRICE_MODE_LABELS: Record<TBookPriceMode, string> = {
  fixed: "Fix összeg",
  per_person: "Fő",
  per_night: "Éjszaka",
  per_person_per_night: "Fő × éjszaka",
  percent: "% az alapdíjból",
}

const TYPE_LABELS: Record<TBookOptionType, string> = {
  select: "Választó (egy érték)",
  multiselect: "Választó (több érték)",
  number: "Szám",
  checkbox: "Jelölőnégyzet",
}

function PriceModeSelect({
  value,
  onChange,
}: {
  value: TBookPriceMode
  onChange: (mode: TBookPriceMode) => void
}) {
  return (
    <TBookSelect value={value} onChange={(e) => onChange(e.target.value as TBookPriceMode)}>
      {Object.entries(PRICE_MODE_LABELS).map(([mode, label]) => (
        <option key={mode} value={mode}>
          {label}
        </option>
      ))}
    </TBookSelect>
  )
}

function ChoicesEditor({
  choices,
  onChange,
}: {
  choices: TBookOptionChoice[]
  onChange: (choices: TBookOptionChoice[]) => void
}) {
  const update = (index: number, patch: Partial<TBookOptionChoice>) => {
    onChange(choices.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Minden sor egy választható lehetőség — a vendég ezek közül választ.
      </p>
      {choices.map((choice, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5">
            <TBookInput
              placeholder="Megnevezés (pl. Fél panzió)"
              value={choice.label}
              onChange={(e) => update(index, { label: e.target.value })}
            />
          </div>
          <div className="col-span-3">
            <TBookInput
              type="number"
              placeholder="Felár (Ft)"
              value={choice.priceHuf}
              onChange={(e) => update(index, { priceHuf: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="col-span-3">
            <PriceModeSelect
              value={choice.priceMode}
              onChange={(priceMode) => update(index, { priceMode })}
            />
          </div>
          <div className="col-span-1">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full text-red-600"
              onClick={() => onChange(choices.filter((_, i) => i !== index))}
              aria-label="Törlés"
            >
              ✕
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-8 text-xs"
        onClick={() =>
          onChange([...choices, { value: "", label: "", priceHuf: 0, priceMode: "fixed" }])
        }
      >
        + Választási lehetőség
      </Button>
    </div>
  )
}

function DependencyValuesEditor({
  option,
  options,
  roomTypes,
  onChange,
}: {
  option: TBookOptionDef
  options: TBookOptionDef[]
  roomTypes: TBookRoomType[]
  onChange: (values: string[]) => void
}) {
  const depKey = option.dependsOn?.key
  if (!depKey) return null

  if (depKey === ROOM_TYPE_SELECTION_KEY) {
    const selected = new Set(option.dependsOn?.values ?? [])
    return (
      <TBookField label="Csak ezeknél a szobatípusoknál jelenjen meg">
        <div className="space-y-1.5 pt-1">
          {roomTypes.map((room, index) => {
            const value = room.key || `room-${index}`
            return (
              <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={selected.has(value)}
                  onChange={(e) => {
                    const next = new Set(selected)
                    if (e.target.checked) next.add(value)
                    else next.delete(value)
                    onChange([...next])
                  }}
                />
                {room.label || "Névtelen szobatípus"}
              </label>
            )
          })}
        </div>
      </TBookField>
    )
  }

  const depOption = options.find((o) => o.key === depKey)
  if (depOption?.choices?.length) {
    const selected = new Set(option.dependsOn?.values ?? [])
    return (
      <TBookField label={`Csak ha „${depOption.label || depOption.key}” értéke:`}>
        <div className="space-y-1.5 pt-1">
          {depOption.choices.map((choice, index) => {
            const value = choice.value || `choice-${index}`
            return (
              <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={selected.has(value)}
                  onChange={(e) => {
                    const next = new Set(selected)
                    if (e.target.checked) next.add(value)
                    else next.delete(value)
                    onChange([...next])
                  }}
                />
                {choice.label || "Névtelen lehetőség"}
              </label>
            )
          })}
        </div>
      </TBookField>
    )
  }

  return (
    <TBookField label="Csak ha az érték (vesszővel)">
      <TBookInput
        placeholder="pl. suite, apartment"
        value={option.dependsOn?.values.join(",") ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          )
        }
      />
    </TBookField>
  )
}

export function OptionSchemaEditor({
  options,
  onChange,
  roomTypes = [],
}: {
  options: TBookOptionDef[]
  onChange: (options: TBookOptionDef[]) => void
  roomTypes?: TBookRoomType[]
}) {
  const update = (index: number, patch: Partial<TBookOptionDef>) => {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= options.length) return
    const next = [...options]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((o, i) => ({ ...o, sortOrder: i })))
  }

  return (
    <div className="space-y-4">
      {options.length === 0 ? (
        <p className={tBookEmptyStateClass}>
          Még nincs foglalási mező ebben a szakaszban.
        </p>
      ) : null}

      {options.map((option, index) => {
        const needsChoices = option.type === "select" || option.type === "multiselect"
        return (
          <div key={index} className="rounded-xl bg-muted/20 shadow-sm p-4 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <TBookField label="Mező neve (vendég látja)">
                  <TBookInput
                    placeholder="pl. Étkezés"
                    value={option.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                  />
                </TBookField>
                <TBookField label="Mező típusa">
                  <TBookSelect
                    value={option.type}
                    onChange={(e) => {
                      const type = e.target.value as TBookOptionType
                      update(index, {
                        type,
                        choices:
                          type === "select" || type === "multiselect"
                            ? (option.choices ?? [])
                            : undefined,
                        defaultValue: null,
                      })
                    }}
                  >
                    {Object.entries(TYPE_LABELS).map(([type, label]) => (
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
                  aria-label="Fel"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground"
                  disabled={index === options.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Le"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600"
                  onClick={() => onChange(options.filter((_, i) => i !== index))}
                  aria-label="Mező törlése"
                >
                  ✕
                </Button>
              </div>
            </div>

            {needsChoices ? (
              <TBookField label="Választható lehetőségek">
                <ChoicesEditor
                  choices={option.choices ?? []}
                  onChange={(choices) => update(index, { choices })}
                />
              </TBookField>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <TBookField label="Felár (Ft)">
                  <TBookInput
                    type="number"
                    value={option.unitPriceHuf ?? 0}
                    onChange={(e) => update(index, { unitPriceHuf: Number(e.target.value) || 0 })}
                  />
                </TBookField>
                <TBookField label="Felár módja">
                  <PriceModeSelect
                    value={option.priceMode ?? "fixed"}
                    onChange={(priceMode) => update(index, { priceMode })}
                  />
                </TBookField>
                {option.type === "number" ? (
                  <>
                    <TBookField label="Minimum">
                      <TBookInput
                        type="number"
                        value={option.min ?? ""}
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
                        value={option.max ?? ""}
                        onChange={(e) =>
                          update(index, {
                            max: e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </TBookField>
                  </>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <label className="flex items-center gap-2 text-sm text-foreground pb-2">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={Boolean(option.required)}
                  onChange={(e) => update(index, { required: e.target.checked })}
                />
                Kötelező mező
              </label>
              <TBookField label="Csak akkor jelenjen meg, ha…">
                <TBookSelect
                  value={option.dependsOn?.key ?? ""}
                  onChange={(e) => {
                    const key = e.target.value
                    update(index, {
                      dependsOn: key ? { key, values: [] } : null,
                    })
                  }}
                >
                  <option value="">Mindig látható</option>
                  {roomTypes.length > 0 ? (
                    <option value={ROOM_TYPE_SELECTION_KEY}>Szobatípus kiválasztva</option>
                  ) : null}
                  {options
                    .filter((o, i) => i !== index && o.label.trim())
                    .map((o, i) => (
                      <option key={`${o.label}-${i}`} value={o.key || `field-${i}`}>
                        {o.label}
                      </option>
                    ))}
                </TBookSelect>
              </TBookField>
              {option.dependsOn ? (
                <div className="sm:col-span-2">
                  <DependencyValuesEditor
                    option={option}
                    options={options}
                    roomTypes={roomTypes}
                    onChange={(values) =>
                      update(index, {
                        dependsOn: {
                          key: option.dependsOn!.key,
                          values,
                        },
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        className="h-10 font-bold"
        onClick={() =>
          onChange([
            ...options,
            {
              key: "",
              label: "",
              type: "select",
              required: false,
              choices: [],
              sortOrder: options.length,
            },
          ])
        }
      >
        + Foglalási mező
      </Button>
    </div>
  )
}
