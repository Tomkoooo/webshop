"use client"

import { useMemo, useState } from "react"
import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { ProductPickerModal } from "@wse/core/features/homepage-cms/components/editor/ProductPickerModal"
import { InspectorTabs } from "./InspectorTabs"

type Props = {
  selectedBlock: HomepageBlock | null
  onFieldChange: (field: string, value: unknown) => void
  onDelete: () => void
  onDuplicate: () => void
}

export function InspectorPanel({ selectedBlock, onFieldChange, onDelete, onDuplicate }: Props) {
  const [openProductPicker, setOpenProductPicker] = useState(false)
  const selectedProducts = useMemo(() => {
    if (!selectedBlock || selectedBlock.type !== "productGrid") return []
    return Array.isArray(selectedBlock.data.selectedProductIds)
      ? (selectedBlock.data.selectedProductIds as string[])
      : []
  }, [selectedBlock])

  return (
    <aside className="w-[360px] border-l border-white/10 p-4 bg-black/60 overflow-auto sticky top-[72px] self-start max-h-[calc(100vh-72px)]">
      <div className="space-y-3">
        <h3 className="text-white uppercase tracking-wider text-xs font-bold">
          {selectedBlock ? `${selectedBlock.type} inspector` : "Inspector"}
        </h3>
        {selectedBlock ? (
          <label className="flex items-center justify-between gap-3 border border-white/15 px-3 py-2 text-xs uppercase tracking-widest text-neutral-300">
            <span>Block visible</span>
            <input
              type="checkbox"
              checked={selectedBlock.enabled !== false}
              onChange={(event) => onFieldChange("enabled", event.target.checked)}
            />
          </label>
        ) : null}
        <InspectorTabs selectedBlock={selectedBlock} onFieldChange={onFieldChange} />
        {selectedBlock?.type === "productGrid" ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setOpenProductPicker(true)}
              className="w-full h-10 border border-white/20 text-white text-xs uppercase"
            >
              Pick featured products
            </button>
            <p className="text-xs text-neutral-400">{selectedProducts.length} termék kiválasztva (sorrend = megjelenítés)</p>
            <p className="text-xs text-neutral-500">
              Üres lista esetén a Webshop → Kiemelt termékek beállítások érvényesek.
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onDuplicate}
          className="w-full h-10 border border-white/20 text-white text-xs uppercase"
        >
          Duplicate block
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-full h-10 border border-red-500 text-red-300 text-xs uppercase"
        >
          Remove block
        </button>
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
