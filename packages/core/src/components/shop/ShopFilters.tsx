"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, Check, Filter } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { cn } from "@wse/core/lib/utils"

interface ShopFiltersProps {
  categories: any[]
}

export function ShopFilters({ categories }: ShopFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentCategory = searchParams.get("category")
  const currentQ = searchParams.get("q") || ""
  const isDiscounted = searchParams.get("discounted") === "true"

  const [q, setQ] = React.useState(currentQ)

  React.useEffect(() => {
    setQ(currentQ)
  }, [currentQ])

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set("page", "1")
    router.push(`/shop?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange("q", q)
  }

  return (
    <div className="space-y-12">
      {/* Search Filter */}
      <div className="space-y-4">
        <h3 className="text-xs font-black tracking-[0.3em] uppercase text-white/40 flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-primary" />
          Keresés
        </h3>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="MIT KERESEL?"
            className="bg-white/5 border-white/5 pl-12 h-14 rounded-none text-[10px] font-bold tracking-[0.2em] text-white placeholder:text-neutral-700 focus-visible:ring-primary-foreground/40"
          />
        </form>
      </div>

      {/* Category Filter */}
      <div className="space-y-4">
        <h3 className="text-xs font-black tracking-[0.3em] uppercase text-white/40 flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-primary" />
          Kategóriák
        </h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleFilterChange("category", null)}
            className={cn(
              "flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all",
              !currentCategory ? "bg-primary text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            Összes Termék
            {!currentCategory && <Check className="w-4 h-4" />}
          </button>
          
          <CategoryTree 
            categories={categories} 
            currentCategory={currentCategory} 
            onSelect={(id: string) => handleFilterChange("category", id)} 
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="space-y-4">
        <h3 className="text-xs font-black tracking-[0.3em] uppercase text-white/40 flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-primary" />
          Gyors Szűrők
        </h3>
        <button
          onClick={() => handleFilterChange("discounted", isDiscounted ? null : "true")}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-2",
            isDiscounted 
              ? "bg-primary/10 border-primary-foreground/35 text-primary-foreground" 
              : "border-white/5 text-neutral-400 hover:text-white hover:border-white/20"
          )}
        >
          Csak Akciós
          <div className={cn(
            "w-4 h-4 border-2 flex items-center justify-center",
            isDiscounted ? "border-primary-foreground/35 bg-primary" : "border-white/20"
          )}>
            {isDiscounted && <Check className="w-3 h-3 text-white" />}
          </div>
        </button>
      </div>

      {/* Clear All */}
      {(currentCategory || currentQ || isDiscounted) && (
        <Button
          onClick={() => router.push("/shop")}
          variant="ghost"
          className="w-full h-12 text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 font-black uppercase text-[10px] tracking-widest gap-3"
        >
          <X className="w-4 h-4" />
          Szűrők Törlése
        </Button>
      )}
    </div>
  )
}

function CategoryTree({ 
  categories, 
  currentCategory, 
  onSelect, 
  depth = 0 
}: { 
  categories: any[], 
  currentCategory: string | null, 
  onSelect: (id: string) => void,
  depth?: number 
}) {
  return (
    <>
      {categories.map((cat) => (
        <React.Fragment key={cat._id}>
          <button
            onClick={() => onSelect(cat._id)}
            className={cn(
              "flex items-center justify-between py-3 text-[11px] font-black uppercase tracking-widest transition-all pr-4",
              currentCategory === cat._id ? "bg-primary text-white pl-4" : "text-neutral-400 hover:text-white hover:bg-white/5 ml-4"
            )}
            style={{ paddingLeft: currentCategory === cat._id ? undefined : `${depth * 12}px`, marginLeft: currentCategory === cat._id ? '0' : undefined }}
          >
            <div className="flex items-center gap-2">
              {depth > 0 && <div className="w-2 h-px bg-white/20" />}
              {cat.name}
            </div>
            {currentCategory === cat._id && <Check className="w-4 h-4" />}
          </button>
          {cat.children && cat.children.length > 0 && (
            <CategoryTree 
              categories={cat.children} 
              currentCategory={currentCategory} 
              onSelect={onSelect} 
              depth={depth + 1} 
            />
          )}
        </React.Fragment>
      ))}
    </>
  )
}
