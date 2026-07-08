"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@wse/core/components/ui/dropdown-menu"
import { Button } from "@wse/core/components/ui/button"
import { Badge } from "@wse/core/components/ui/badge"

const sortOptions = [
  { label: "Kiemelt", value: "featured" },
  { label: "Legújabb", value: "newest" },
  { label: "Ár: növekvő", value: "price-asc" },
  { label: "Ár: csökkenő", value: "price-desc" },
  { label: "Akciós", value: "discount" },
]

/** Compact toolbar — same sort query contract as engine `ShopHeader`, different composition from default-modern block. */
export function AtelierShopHeader({ total, q }: { total: number; q?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sort") || "featured"

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    params.set("page", "1")
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-2">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {q ? `„${q}”` : "Katalógus"}
        </h2>
        <Badge variant="secondary" className="rounded-full border border-border px-3 py-0.5 font-serif text-[11px] font-normal uppercase tracking-widest">
          {total} tétel
        </Badge>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-10 shrink-0 rounded-full border border-border bg-background px-4 font-serif text-xs uppercase tracking-widest"
          >
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            {sortOptions.find((o) => o.value === currentSort)?.label}
            <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl border border-border bg-background">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className="cursor-pointer rounded-lg font-serif text-xs uppercase tracking-widest"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
