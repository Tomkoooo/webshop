"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import type { ComponentType } from "react"
import { AtelierCategoryPill } from "@wse/template-atelier-showcase/commerce/AtelierCategoryPill"

type PillProps = { label: string; active?: boolean; href?: string }

function useShopQueryHref() {
  const searchParams = useSearchParams()
  return React.useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const p = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === "") p.delete(k)
        else p.set(k, v)
      }
      p.set("page", "1")
      const qs = p.toString()
      return qs ? `/shop?${qs}` : "/shop"
    },
    [searchParams]
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenCategories(categories: any[], depth = 0): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = []
  for (const cat of categories) {
    const prefix = depth > 0 ? `${"·".repeat(depth)} ` : ""
    out.push({ id: cat._id, label: `${prefix}${cat.name}` })
    if (cat.children?.length) {
      out.push(...flattenCategories(cat.children, depth + 1))
    }
  }
  return out
}

/**
 * Catalogue controls: same URL semantics as engine `ShopFilters`, template-owned **horizontal** strip
 * (contrasts with default-modern sidebar / sheet pattern).
 */
export function AtelierShopFilters({
  categories,
  CategoryPill,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[]
  CategoryPill?: ComponentType<PillProps>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hrefWith = useShopQueryHref()
  const Pill = CategoryPill ?? AtelierCategoryPill

  const currentCategory = searchParams.get("category")
  const currentQ = searchParams.get("q") || ""
  const isDiscounted = searchParams.get("discounted") === "true"
  const [q, setQ] = React.useState(currentQ)

  React.useEffect(() => {
    setQ(currentQ)
  }, [currentQ])

  const hrefAll = hrefWith({ category: null })
  const hrefDiscounted = hrefWith({ discounted: isDiscounted ? null : "true" })
  const hrefForCategory = (id: string) => hrefWith({ category: id })
  const flatCats = React.useMemo(() => flattenCategories(categories), [categories])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(hrefWith({ q: q.trim() || null }))
  }

  return (
    <div className="flex flex-col gap-5 border-b-2 border-border pb-6 md:flex-row md:flex-wrap md:items-end md:gap-x-8 md:gap-y-4">
      <form onSubmit={handleSearchSubmit} className="relative min-w-[min(100%,18rem)] flex-1 md:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kulcsszó…"
          className="h-11 rounded-full border border-border bg-background pl-10 font-serif text-sm shadow-inner"
        />
      </form>

      <div className="min-w-0 flex-1 md:flex-[2]">
        <p className="mb-2 font-serif text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Kategóriák
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          <Pill label="Összes" active={!currentCategory} href={hrefAll} />
          {flatCats.map((c) => (
            <Pill
              key={c.id}
              label={c.label}
              active={currentCategory === c.id}
              href={hrefForCategory(c.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Pill label="Csak akciós" active={isDiscounted} href={hrefDiscounted} />
        {(currentCategory || currentQ || isDiscounted) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/shop")}
            className="h-9 shrink-0 rounded-full font-serif text-xs text-rose-600 hover:bg-rose-500/10"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Törlés
          </Button>
        )}
      </div>
    </div>
  )
}
