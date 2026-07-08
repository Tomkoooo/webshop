"use client"

import { Button } from "@wse/core/components/ui/button"
import type {
  TBookOptionChoice,
  TBookOptionDef,
  TBookOptionType,
  TBookPriceMode,
} from "../lib/pricing-types"
import { TBookField, TBookInput, TBookSelect } from "./t-book-admin-ui"

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

function slugifyKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
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
      {choices.map((choice, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <TBookInput
              placeholder="Címke (pl. Fél panzió)"
              value={choice.label}
              onChange={(e) => {
                const label = e.target.value
                update(index, {
                  label,
                  value: choice.value || slugifyKey(label),
                })
              }}
            />
          </div>
          <div className="col-span-3">
            <TBookInput
              placeholder="érték (kulcs)"
              value={choice.value}
              onChange={(e) => update(index, { value: slugifyKey(e.target.value) })}
            />
          </div>
          <div className="col-span-2">
            <TBookInput
              type="number"
              placeholder="Felár (Ft)"
              value={choice.priceHuf}
              onChange={(e) => update(index, { priceHuf: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="col-span-2">
            <PriceModeSelect
              value={choice.priceMode}
              onChange={(priceMode) => update(index, { priceMode })}
            />
          </div>
          <div className="col-span-1">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full text-red-300"
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
        className="h-8 border-white/10 text-white text-xs"
        onClick={() =>
          onChange([...choices, { value: "", label: "", priceHuf: 0, priceMode: "fixed" }])
        }
      >
        + Választási lehetőség
      </Button>
    </div>
  )
}

/**
 * Dynamic key-value config builder: each row is a selectable option with its
 * own add-on pricing (fixed / per-person / per-night / percent) and optional
 * dependency on another option.
 */
export function OptionSchemaEditor({
  options,
  onChange,
  roomTypeKeys = [],
}: {
  options: TBookOptionDef[]
  onChange: (options: TBookOptionDef[]) => void
  /** Room type keys available for dependsOn (e.g. standard, suite). */
  roomTypeKeys?: string[]
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
      {options.map((option, index) => {
        const needsChoices = option.type === "select" || option.type === "multiselect"
        return (
          <div key={index} className="border border-white/10 rounded-xl p-4 bg-black/40 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <TBookField label="Címke">
                  <TBookInput
                    placeholder="pl. Étkezés"
                    value={option.label}
                    onChange={(e) => {
                      const label = e.target.value
                      update(index, {
                        label,
                        key: option.key || slugifyKey(label),
                      })
                    }}
                  />
                </TBookField>
                <TBookField label="Kulcs">
                  <TBookInput
                    placeholder="pl. meals"
                    value={option.key}
                    onChange={(e) => update(index, { key: slugifyKey(e.target.value) })}
                  />
                </TBookField>
                <TBookField label="Típus">
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
                  className="h-8 w-8 p-0 text-neutral-400"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Fel"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-neutral-400"
                  disabled={index === options.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Le"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-300"
                  onClick={() => onChange(options.filter((_, i) => i !== index))}
                  aria-label="Opció törlése"
                >
                  ✕
                </Button>
              </div>
            </div>

            {needsChoices ? (
              <TBookField label="Választási lehetőségek (címke, kulcs, felár, mód)">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <label className="flex items-center gap-2 text-sm text-neutral-300 pb-2">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={Boolean(option.required)}
                  onChange={(e) => update(index, { required: e.target.checked })}
                />
                Kötelező
              </label>
              <TBookField label="Függőség (opció kulcs)">
                <TBookSelect
                  value={option.dependsOn?.key ?? ""}
                  onChange={(e) => {
                    const key = e.target.value
                    update(index, {
                      dependsOn: key ? { key, values: option.dependsOn?.values ?? [] } : null,
                    })
                  }}
                >
                  <option value="">— nincs —</option>
                  {roomTypeKeys.length > 0 ? (
                    <option value="room_type">Szobatípus (room_type)</option>
                  ) : null}
                  {options
                    .filter((o) => o.key && o.key !== option.key)
                    .map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label || o.key}
                      </option>
                    ))}
                </TBookSelect>
              </TBookField>
              {option.dependsOn ? (
                <TBookField label="Csak ha az érték (vesszővel)">
                  <TBookInput
                    placeholder="pl. suite,apartment"
                    value={option.dependsOn.values.join(",")}
                    onChange={(e) =>
                      update(index, {
                        dependsOn: {
                          key: option.dependsOn!.key,
                          values: e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </TBookField>
              ) : null}
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        className="h-10 border-white/10 text-white font-bold"
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
        + Új opció
      </Button>
    </div>
  )
}
