"use client"

import { useState } from "react"
import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"

type Props = {
  selectedBlock: HomepageBlock | null
  onFieldChange: (field: string, value: unknown) => void
}

export function InspectorTabs({ selectedBlock, onFieldChange }: Props) {
  const [tab, setTab] = useState<"content" | "style" | "data">("content")

  if (!selectedBlock) {
    return <p className="text-sm text-neutral-400">Select a block to inspect settings.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["content", "style", "data"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`px-2 h-7 text-xs uppercase border ${tab === item ? "border-primary-foreground/35 text-white" : "border-white/20 text-neutral-300"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "content" ? (
        <div className="space-y-2">
          {Object.entries(selectedBlock.data).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400">{key}</label>
              <input
                value={typeof value === "string" || typeof value === "number" ? String(value) : JSON.stringify(value)}
                onChange={(event) => onFieldChange(key, event.target.value)}
                className="w-full h-9 px-2 bg-black border border-white/20 text-sm text-white"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          {tab === "style" ? "Style controls will be configured per block." : "Data bindings appear here when supported."}
        </p>
      )}
    </div>
  )
}
