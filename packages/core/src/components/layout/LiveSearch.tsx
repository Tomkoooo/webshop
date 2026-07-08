"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Input } from "@wse/core/components/ui/input"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { useClickAway } from "react-use"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { buildProductListingLines } from "@wse/core/lib/product-variants"
import { listingHasPriceRange, listingPriceSummary } from "@wse/core/lib/pricing"

interface LiveSearchProps {
  className?: string
  placeholder?: string
  inputClassName?: string
}

export function LiveSearch({ className, placeholder = "KERESÉS...", inputClassName }: LiveSearchProps) {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  useClickAway(containerRef, () => setIsOpen(false))

  const handleSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error) {
      console.error("Search fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (q) handleSearch(q)
      else setResults([])
    }, 300)

    return () => clearTimeout(timer)
  }, [q, handleSearch])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      router.push(`/shop?q=${encodeURIComponent(q)}`)
      setIsOpen(false)
    }
  }

  const navigateToProduct = (slug: string) => {
    router.push(`/products/${slug}`)
    setIsOpen(false)
    setQ("")
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={onSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "pl-12 bg-muted/40 border-border focus-visible:ring-primary-foreground/40 rounded-none text-[10px] font-bold tracking-[0.2em] text-foreground placeholder:text-muted-foreground transition-all",
            inputClassName
          )}
        />
        {isLoading && (
          <LoadingSpinner size="xs" className="absolute right-4 top-1/2 -translate-y-1/2" />
        )}
      </form>

      {isOpen && (q.length >= 2 || (q.length > 0 && results.length === 0)) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background-dark border border-border shadow-2xl z-50 overflow-hidden">
          {results.length > 0 ? (
            <div className="flex flex-col">
              {results.map((product) => {
                const variants = Array.isArray(product.variants)
                  ? product.variants.filter((variant: any) => variant.isActive !== false)
                  : []
                const needsVariantSelection = Boolean(product.requireVariantSelection) && variants.length > 0
                const listingLines = buildProductListingLines(product)
                const { unitGross: fromGross } = listingPriceSummary(listingLines, product.vatPercent)
                const hasPriceRange = listingHasPriceRange(listingLines, product.vatPercent)
                return (
                  <button
                    key={product._id}
                    onClick={() => navigateToProduct(product.slug)}
                    className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors text-left border-b border-border last:border-0"
                  >
                    <div className="relative w-12 h-12 bg-surface border border-border flex-none">
                      <FallbackImage
                        src={mediaImageSrc(product.images?.[0])}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="grow min-w-0">
                      <p className="text-xs font-black text-foreground uppercase truncate tracking-widest">{product.name}</p>
                      <p className="text-[10px] font-bold text-primary-foreground mt-1">
                        {needsVariantSelection && hasPriceRange ? "Tól " : ""}
                        {fromGross.toLocaleString("hu-HU")} FT
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-700" />
                  </button>
                )
              })}
              <Button
                onClick={onSubmit}
                variant="ghost"
                className="w-full h-12 rounded-none bg-primary/10 text-primary-foreground hover:bg-primary hover:text-primary-foreground font-black text-[10px] tracking-widest uppercase gap-3 transition-all"
              >
                Minden találat megtekintése
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : !isLoading && q.length >= 2 ? (
            <div className="p-8 text-center bg-muted/40 border-t border-border">
              <p className="text-neutral-500 text-xs font-black tracking-widest uppercase mb-4 italic">
                Nincs találat, megnyitás a katalógusban
              </p>
              <Button
                onClick={() => {
                   router.push('/shop')
                   setIsOpen(false)
                }}
                variant="outline"
                className="w-full h-12 border-border text-foreground hover:bg-muted/40 rounded-none font-black text-[10px] tracking-widest uppercase transition-all"
              >
                Keresés a boltban
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
