"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, Edit2, Plus, Search, Trash2 } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { useClickAway } from "react-use"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { cn } from "@wse/core/lib/utils"

const MAX_PRODUCTS = 100
const SEARCH_MIN_CHARS = 2

type MiniProduct = { id: string; name: string; slug: string; image: string }

export function FixedProductsSourcePicker({
  productIds,
  onChange,
}: {
  productIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [resolved, setResolved] = React.useState<MiniProduct[]>([])
  const [hydrating, setHydrating] = React.useState(false)
  const [q, setQ] = React.useState("")
  const [results, setResults] = React.useState<MiniProduct[]>([])
  const [searching, setSearching] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  useClickAway(wrapRef, () => setDropdownOpen(false))

  React.useEffect(() => {
    if (productIds.length === 0) {
      setResolved([])
      return
    }
    let cancelled = false
    const run = async () => {
      setHydrating(true)
      try {
        const res = await fetch("/api/admin/products/resolve-mini", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: productIds }),
        })
        if (!res.ok) return
        const data = (await res.json()) as { items: MiniProduct[] }
        if (!cancelled) setResolved(data.items ?? [])
      } finally {
        if (!cancelled) setHydrating(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [productIds])

  const resolvedById = React.useMemo(() => new Map(resolved.map((p) => [p.id, p])), [resolved])

  const displayRows = React.useMemo(() => {
    return productIds.map((id) => {
      const hit = resolvedById.get(id)
      if (hit) return hit
      if (hydrating) return { id, name: "Betöltés…", slug: "", image: "" }
      return { id, name: "A termék nem található", slug: "Érdemes eltávolítani a listáról", image: "" }
    })
  }, [productIds, resolvedById, hydrating])

  React.useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim()
      if (term.length < SEARCH_MIN_CHARS) {
        setResults([])
        setSearching(false)
        return
      }
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(term)}&page=1`)
        if (!res.ok) {
          setResults([])
          return
        }
        const data = (await res.json()) as { items: MiniProduct[] }
        setResults(data.items ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 320)
    return () => clearTimeout(t)
  }, [q])

  const addProduct = (p: MiniProduct) => {
    if (productIds.length >= MAX_PRODUCTS) return
    if (productIds.includes(p.id)) return
    onChange([...productIds, p.id])
    setResolved((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev
      return [...prev, p]
    })
    setQ("")
    setResults([])
    setDropdownOpen(false)
  }

  const removeAt = (idx: number) => {
    onChange(productIds.filter((_, i) => i !== idx))
  }

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= productIds.length) return
    const next = [...productIds]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onChange(next)
  }

  const filteredResults = results.filter((r) => !productIds.includes(r.id))

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-muted-foreground text-xs font-medium text-muted-foreground">
          Konkrét termékek
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Keress név vagy cikkszó alapján, és kattints a listára. A sorrend meghatározza a javaslatok prioritását.
        </p>
      </div>

      <div ref={wrapRef} className="relative space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setDropdownOpen(true)
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Kezdj el gépelni (min. 2 karakter)…"
            className="rounded-md border-border bg-muted/50 pl-10 text-foreground placeholder:text-muted-foreground"
            autoComplete="off"
          />
          {searching ? (
            <LoadingSpinner size="xs" className="absolute right-3 top-1/2 -translate-y-1/2" />
          ) : null}
        </div>

        {dropdownOpen && q.trim().length >= SEARCH_MIN_CHARS ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto border border-border bg-[#0f0f10] shadow-xl">
            {filteredResults.length === 0 && !searching ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nincs találat. Próbálj más keresőszót.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {filteredResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                      onClick={() => addProduct(p)}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-border bg-muted">
                        <FallbackImage src={p.image} alt="" width={44} height={44} className="h-full w-full object-cover" />
                      </div>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{p.name}</span>
                      <Plus className="h-4 w-4 shrink-0 admin-icon-accent" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-md border border-border bg-muted/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground text-muted-foreground">
            Kiválasztva ({productIds.length} / {MAX_PRODUCTS})
          </span>
          {hydrating ? <span className="text-xs text-muted-foreground">Szinkronizálás…</span> : null}
        </div>

        {productIds.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Még nincs kiválasztott termék. Használd a keresőt fent.
          </p>
        ) : (
          <ul className="space-y-2">
            {displayRows.map((row, idx) => (
              <li
                key={row.id}
                className="flex items-center gap-3 border border-border bg-background/30 px-3 py-2.5"
              >
                <div className="flex flex-col gap-0.5 border-r border-border pr-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                    aria-label="Fel"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                    disabled={idx === productIds.length - 1}
                    onClick={() => move(idx, 1)}
                    aria-label="Le"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-border bg-muted">
                  <FallbackImage src={row.image} alt="" width={56} height={56} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{row.name}</p>
                  {row.slug ? (
                    <p className="truncate text-xs text-muted-foreground">/{row.slug}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1 border-l border-border pl-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link href={`/admin/products/${row.id}`} target="_blank" rel="noreferrer" title="Megnyitás szerkesztőben">
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-md text-muted-foreground hover:text-rose-400"
                    title="Eltávolítás"
                    onClick={() => removeAt(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
