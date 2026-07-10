"use client"

import { useState } from "react"
import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

type Props = {
  selectedBlock: HomepageBlock | null
  onFieldChange: (field: string, value: unknown) => void
}

export function InspectorTabs({ selectedBlock, onFieldChange }: Props) {
  const [tab, setTab] = useState<"content" | "style" | "data">("content")

  if (!selectedBlock) {
    return <p className="text-sm text-muted-foreground">Válassz blokkot a beállításokhoz.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
        {(["content", "style", "data"] as const).map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={tab === item ? "secondary" : "ghost"}
            className="h-8 flex-1 capitalize"
            onClick={() => setTab(item)}
          >
            {item === "content" ? "Tartalom" : item === "style" ? "Stílus" : "Adat"}
          </Button>
        ))}
      </div>
      {tab === "content" ? (
        <div className="space-y-3">
          {Object.entries(selectedBlock.data).map(([key, value]) => (
            <div key={key} className="space-y-1.5">
              <Label className={cn(adminFieldLabel, "text-xs")}>{key}</Label>
              <Input
                value={typeof value === "string" || typeof value === "number" ? String(value) : JSON.stringify(value)}
                onChange={(event) => onFieldChange(key, event.target.value)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {tab === "style"
            ? "A stílus vezérlők blokkonként lesznek konfigurálva."
            : "Az adatkötések itt jelennek meg, ha támogatottak."}
        </p>
      )}
    </div>
  )
}
