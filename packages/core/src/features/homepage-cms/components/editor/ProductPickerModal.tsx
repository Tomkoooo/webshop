"use client"

import { useEffect, useState } from "react"
import { Button } from "@wse/core/components/ui/button"
import { Checkbox } from "@wse/core/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { Input } from "@wse/core/components/ui/input"

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

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Termékek kiválasztása</DialogTitle>
        </DialogHeader>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Termék keresése…"
        />
        <div className="max-h-[360px] space-y-2 overflow-auto">
          {items.map((item) => {
            const checked = localSelected.includes(item.id)
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg bg-muted/40 p-3"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() =>
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Button type="button" variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Előző
          </Button>
          <span>Oldal: {page}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setPage((prev) => prev + 1)}>
            Következő
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Mégse
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(localSelected)
              onClose()
            }}
          >
            Alkalmaz ({localSelected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
