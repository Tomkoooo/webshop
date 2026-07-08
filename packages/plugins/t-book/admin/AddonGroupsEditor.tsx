"use client"

import { useState } from "react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import type { TBookAddonGroup } from "../lib/pricing-types"
import { slugifyHotelKey } from "../lib/hotel-pricing"
import { TBookField, TBookInput } from "./t-book-admin-ui"
import { OptionSchemaEditor } from "./OptionSchemaEditor"

export function AddonGroupsEditor({
  groups,
  onChange,
  roomTypeKeys = [],
}: {
  groups: TBookAddonGroup[]
  onChange: (groups: TBookAddonGroup[]) => void
  roomTypeKeys?: string[]
}) {
  const [openKey, setOpenKey] = useState<string | null>(groups[0]?.key ?? null)

  const updateGroup = (index: number, patch: Partial<TBookAddonGroup>) => {
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)))
  }

  const moveGroup = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= groups.length) return
    const next = [...groups]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((group, i) => ({ ...group, sortOrder: i })))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        Csoportosítsd a felárakat (étkezés, akadálymentesség, parkolás…) — a vendég lépésről lépésre
        tölti ki őket. A szobatípus már külön van kezelve.
      </p>

      {groups.length === 0 ? (
        <p className="text-sm text-neutral-500 border border-dashed border-white/15 rounded-lg px-4 py-6 text-center">
          Nincs felár-csoport — csak szobatípus alapár fog szerepelni a foglalásban.
        </p>
      ) : null}

      {groups.map((group, index) => {
        const isOpen = openKey === group.key || (!openKey && index === 0)
        const optionCount = group.options.length
        return (
          <div
            key={index}
            className="border border-white/10 rounded-xl overflow-hidden bg-black/30"
          >
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5"
              onClick={() => setOpenKey(isOpen ? null : group.key)}
            >
              <div className="min-w-0">
                <p className="font-bold text-white text-sm truncate">
                  {group.label || "Névtelen csoport"}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {optionCount} mező · kulcs: <code>{group.key || "—"}</code>
                </p>
              </div>
              <span className={cn("text-neutral-500 text-xs", isOpen && "rotate-180")}>▼</span>
            </button>

            {isOpen ? (
              <div className="border-t border-white/10 p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TBookField label="Csoport neve">
                    <TBookInput
                      value={group.label}
                      onChange={(e) => {
                        const label = e.target.value
                        updateGroup(index, {
                          label,
                          key: group.key || slugifyHotelKey(label),
                        })
                      }}
                      placeholder="Étkezés"
                    />
                  </TBookField>
                  <TBookField label="Kulcs">
                    <TBookInput
                      value={group.key}
                      onChange={(e) => updateGroup(index, { key: slugifyHotelKey(e.target.value) })}
                      placeholder="meals"
                    />
                  </TBookField>
                </div>
                <TBookField label="Rövid leírás (opcionális)">
                  <TBookInput
                    value={group.description ?? ""}
                    onChange={(e) => updateGroup(index, { description: e.target.value })}
                    placeholder="Válassz étkezési csomagot"
                  />
                </TBookField>
                <OptionSchemaEditor
                  options={group.options}
                  onChange={(options) => updateGroup(index, { options })}
                  roomTypeKeys={roomTypeKeys}
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 text-neutral-400"
                    disabled={index === 0}
                    onClick={() => moveGroup(index, -1)}
                  >
                    Csoport fel
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 text-red-300"
                    onClick={() => onChange(groups.filter((_, i) => i !== index))}
                  >
                    Csoport törlése
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        className="h-10 border-white/10 text-white font-bold"
        onClick={() => {
          const key = `group_${groups.length + 1}`
          const next = [
            ...groups,
            {
              key,
              label: "Új felár-csoport",
              description: "",
              sortOrder: groups.length,
              options: [],
            },
          ]
          onChange(next)
          setOpenKey(key)
        }}
      >
        + Felár-csoport
      </Button>
    </div>
  )
}
