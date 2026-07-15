"use client"

import { useState } from "react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import type { TBookAddonGroup, TBookRoomType } from "../lib/pricing-types"
import { tBookAccordionPanelClass, tBookEmptyStateClass, TBookField, TBookInput } from "./t-book-admin-ui"
import { OptionSchemaEditor } from "./OptionSchemaEditor"

export function AddonGroupsEditor({
  groups,
  onChange,
  roomTypes = [],
}: {
  groups: TBookAddonGroup[]
  onChange: (groups: TBookAddonGroup[]) => void
  roomTypes?: TBookRoomType[]
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
      <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-2">
        <p>
          <strong className="text-foreground">Foglalási szakasz</strong> — cím és rövid leírás, amit
          a vendég lát (pl. „Plusz szolgáltatások”).
        </p>
        <p>
          <strong className="text-foreground">Foglalási mező</strong> — egy konkrét kérdés a szakaszon
          belül (pl. „Étkezés” választó, „Akadálymentesség” jelölőnégyzet).
        </p>
        <p>A szobatípus már külön lépésben van — ide csak extrák és felárak kerülnek.</p>
      </div>

      {groups.length === 0 ? (
        <p className={tBookEmptyStateClass}>
          Nincs extrák szakasz — csak szobatípus alapár fog szerepelni a foglalásban.
        </p>
      ) : null}

      {groups.map((group, index) => {
        const panelKey = group.key || `group-${index}`
        const isOpen = openKey === panelKey || (!openKey && index === 0)
        const optionCount = group.options.length
        return (
          <div key={panelKey} className={tBookAccordionPanelClass}>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
              onClick={() => setOpenKey(isOpen ? null : panelKey)}
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  {group.label || "Névtelen szakasz"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {optionCount} foglalási mező
                  {group.description ? ` · ${group.description}` : ""}
                </p>
              </div>
              <span className={cn("text-muted-foreground text-xs", isOpen && "rotate-180")}>▼</span>
            </button>

            {isOpen ? (
              <div className="border-t border-border/40 p-4 space-y-4">
                <TBookField label="Szakasz címe (vendég látja)">
                  <TBookInput
                    value={group.label}
                    onChange={(e) => updateGroup(index, { label: e.target.value })}
                    placeholder="Pl. Étkezés és kényelem"
                  />
                </TBookField>
                <TBookField label="Szakasz leírása (opcionális, vendég látja)">
                  <TBookInput
                    value={group.description ?? ""}
                    onChange={(e) => updateGroup(index, { description: e.target.value })}
                    placeholder="Pl. Válassz étkezési csomagot és extra szolgáltatásokat"
                  />
                </TBookField>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Foglalási mezők ebben a szakaszban</p>
                  <OptionSchemaEditor
                    options={group.options}
                    onChange={(options) => updateGroup(index, { options })}
                    roomTypes={roomTypes}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 text-muted-foreground"
                    disabled={index === 0}
                    onClick={() => moveGroup(index, -1)}
                  >
                    Szakasz fel
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 text-red-600"
                    onClick={() => onChange(groups.filter((_, i) => i !== index))}
                  >
                    Szakasz törlése
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
        className="h-10 font-bold"
        onClick={() => {
          const next = [
            ...groups,
            {
              key: "",
              label: "Új szakasz",
              description: "",
              sortOrder: groups.length,
              options: [],
            },
          ]
          onChange(next)
          setOpenKey(`group-${groups.length}`)
        }}
      >
        + Foglalási szakasz
      </Button>
    </div>
  )
}
