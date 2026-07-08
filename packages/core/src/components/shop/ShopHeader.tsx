"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  LayoutGrid, 
  List, 
  ChevronDown,
  ArrowUpDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@wse/core/components/ui/dropdown-menu"
import { Button } from "@wse/core/components/ui/button"

interface ShopHeaderProps {
  total: number
  q?: string
}

const sortOptions = [
  { label: "Kiemelt", value: "featured" },
  { label: "Legújabb", value: "newest" },
  { label: "Ár: Alacsonytól", value: "price-asc" },
  { label: "Ár: Magastól", value: "price-desc" },
  { label: "Akciós", value: "discount" },
]

export function ShopHeader({ total, q }: ShopHeaderProps) {
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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-surface/30 p-6 border border-border/40">
      <div>
        <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter mb-1">
          {q ? `KERESÉS: "${q}"` : "ÖSSZES TERMÉK"}
        </h1>
        <p className="text-neutral-500 text-xs font-black tracking-widest uppercase">
          {total} TALÁLAT A KÉSZLETBEN
        </p>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-12 border-border/40 bg-background-dark text-foreground hover:bg-surface/50 hover:text-foreground rounded-none flex gap-3 px-6 font-black text-[10px] tracking-[0.2em] uppercase">
              <ArrowUpDown className="w-4 h-4 text-primary-foreground" />
              Rendezés: {sortOptions.find(o => o.value === currentSort)?.label}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background-dark border-border/40 rounded-none w-56 p-2">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className="text-foreground hover:bg-primary focus:bg-primary cursor-pointer rounded-none font-black text-[10px] tracking-widest uppercase py-3 px-4"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex border border-border/40 rounded-none h-12 overflow-hidden ml-auto">
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-none bg-surface/40 border-none text-primary-foreground">
            <LayoutGrid className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-none hover:bg-surface/50 text-muted-foreground border-none">
            <List className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
