"use client"

import { useState } from "react"
import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { ProductPickerModal } from "@wse/core/features/homepage-cms/components/editor/ProductPickerModal"
import { InspectorTabs } from "./InspectorTabs"
import { Button } from "@wse/core/components/ui/button"
import { Checkbox } from "@wse/core/components/ui/checkbox"
import { Label } from "@wse/core/components/ui/label"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"

type Props = {
  selectedBlock: HomepageBlock | null
  onFieldChange: (field: string, value: unknown) => void
  onDelete: () => void
  onDuplicate: () => void
}

export function InspectorPanel({ selectedBlock, onFieldChange, onDelete, onDuplicate }: Props) {
  const [openProductPicker, setOpenProductPicker] = useState(false)
  const selectedProducts =
    selectedBlock?.type === "productGrid" && Array.isArray(selectedBlock.data.selectedProductIds)
      ? (selectedBlock.data.selectedProductIds as string[])
      : []

  return (
    <aside className="sticky top-[72px] w-[360px] max-h-[calc(100vh-72px)] shrink-0 self-start overflow-auto rounded-xl bg-card p-4 shadow-sm">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          {selectedBlock ? `${selectedBlock.type} szerkesztő` : "Blokk beállítások"}
        </h3>
        {selectedBlock ? (
          <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <Label className={adminFieldLabel}>Blokk látható</Label>
            <Checkbox
              checked={selectedBlock.enabled !== false}
              onCheckedChange={(checked) => onFieldChange("enabled", checked === true)}
            />
          </label>
        ) : null}
        <InspectorTabs selectedBlock={selectedBlock} onFieldChange={onFieldChange} />
        {selectedBlock?.type === "productGrid" ? (
          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full" onClick={() => setOpenProductPicker(true)}>
              Kiemelt termékek kiválasztása
            </Button>
            <p className="text-xs text-muted-foreground">{selectedProducts.length} termék kiválasztva</p>
          </div>
        ) : null}
        <Button type="button" variant="outline" className="w-full" onClick={onDuplicate}>
          Blokk duplikálása
        </Button>
        <Button type="button" variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={onDelete}>
          Blokk törlése
        </Button>
      </div>
      {selectedBlock ? (
        <ProductPickerModal
          open={openProductPicker}
          selected={selectedProducts}
          onClose={() => setOpenProductPicker(false)}
          onApply={(ids) => onFieldChange("selectedProductIds", ids)}
        />
      ) : null}
    </aside>
  )
}
