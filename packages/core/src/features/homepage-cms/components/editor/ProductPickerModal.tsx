"use client"

import { useEffect, useState } from "react"

type ProductItem = {
  id: string
  name: string
  slug: string
}

type Props = {
  open: boolean
  selected: string[]
  onClose: () => void
  onApply: (ids: string[]) => void
}

export function ProductPickerModal({ open, selected, onClose, onApply }: Props) {
  const [items, setItems] = useState<ProductItem[]>([])
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [localSelected, setLocalSelected] = useState<string[]>(selected)

  useEffect(() => {
    setLocalSelected(selected)
  }, [selected])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/api/admin/products/search?q=${encodeURIComponent(query)}&page=${page}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((payload) => setItems(payload.items ?? []))
        .catch(() => setItems([]))
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [open, query, page])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#111] border border-white/15 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold uppercase text-sm tracking-widest">Termékek kiválasztása</h3>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
            Bezárás
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Termék keresése..."
          className="w-full h-10 px-3 bg-black border border-white/20 text-white"
        />
        <div className="max-h-[360px] overflow-auto space-y-2">
          {items.map((item) => {
            const checked = localSelected.includes(item.id)
            return (
              <label key={item.id} className="flex items-center gap-3 border border-white/10 p-2 text-white">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setLocalSelected((prev) =>
                      checked ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                    )
                  }
                />
                <span className="text-sm">{item.name}</span>
              </label>
            )
          })}
        </div>
        <div className="flex justify-between">
          <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="px-3 h-8 border border-white/20 text-xs">
            Előző
          </button>
          <span className="text-xs text-neutral-400">Oldal: {page}</span>
          <button type="button" onClick={() => setPage((prev) => prev + 1)} className="px-3 h-8 border border-white/20 text-xs">
            Következő
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 h-9 border border-white/20 text-white text-xs uppercase">
            Mégse
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(localSelected)
              onClose()
            }}
            className="px-3 h-9 bg-primary text-white text-xs uppercase"
          >
            Alkalmaz
          </button>
        </div>
      </div>
    </div>
  )
}
