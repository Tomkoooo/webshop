"use client"

import * as React from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { useClickAway } from "react-use"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { cn } from "@wse/core/lib/utils"
import { getProductForCouponRule } from "@wse/core/actions/admin-checkout"
import { couponProductRuleKey } from "@wse/core/lib/coupon-product-pricing"

type MiniProduct = { id: string; name: string; slug: string; image: string }

export type CouponProductRuleDraft = {
  product: string
  productName?: string
  variantId?: string
  mode: "percentage" | "fixed_net" | "fixed_gross"
  value: number
}

const MODE_LABELS: Record<CouponProductRuleDraft["mode"], string> = {
  percentage: "% kedvezmény",
  fixed_net: "Fix nettó ár",
  fixed_gross: "Fix bruttó ár",
}

function ruleKey(rule: Pick<CouponProductRuleDraft, "product" | "variantId">): string {
  return couponProductRuleKey(rule.product, rule.variantId)
}

export function CouponProductRulesEditor({
  rules,
  onChange,
}: {
  rules: CouponProductRuleDraft[]
  onChange: (rules: CouponProductRuleDraft[]) => void
}) {
  const [q, setQ] = React.useState("")
  const [results, setResults] = React.useState<MiniProduct[]>([])
  const [searching, setSearching] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  useClickAway(wrapRef, () => setDropdownOpen(false))

  React.useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim()
      if (term.length < 2) {
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

  const addProductRule = (product: MiniProduct, variantId?: string) => {
    const draft: CouponProductRuleDraft = {
      product: product.id,
      productName: product.name,
      variantId,
      mode: "percentage",
      value: 10,
    }
    const key = ruleKey(draft)
    if (rules.some((rule) => ruleKey(rule) === key)) return
    onChange([...rules, draft])
    setQ("")
    setResults([])
    setDropdownOpen(false)
  }

  const addProduct = (product: MiniProduct) => {
    addProductRule(product)
  }

  const addVariantRule = (
    productId: string,
    productName: string,
    variantId: string
  ) => {
    addProductRule({ id: productId, name: productName, slug: "", image: "" }, variantId)
  }

  const updateRule = (index: number, patch: Partial<CouponProductRuleDraft>) => {
    const next = { ...rules[index], ...patch }
    const key = ruleKey(next)
    if (rules.some((rule, i) => i !== index && ruleKey(rule) === key)) return
    onChange(rules.map((rule, i) => (i === index ? next : rule)))
  }

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4 md:col-span-2">
      <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
        Termékáras szabályok
      </Label>
      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">
        Egy kupon alatt több termék és variáns kombináció is lehet (pl. A termék minden variánsa + B
        termék egy variánsa).
      </p>

      <div ref={wrapRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setDropdownOpen(true)
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Termék keresése név vagy slug alapján (min. 2 karakter)"
            className="bg-black border-white/5 h-12 pl-10 text-white rounded-none"
          />
        </div>
        {dropdownOpen && q.trim().length >= 2 ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto border border-white/10 bg-black shadow-xl">
            {searching ? (
              <div className="flex items-center justify-center gap-2 p-4 text-neutral-500">
                <LoadingSpinner className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Keresés…</span>
              </div>
            ) : results.length === 0 ? (
              <p className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Nincs találat
              </p>
            ) : (
              results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-white">{product.name}</span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                      {product.slug}
                    </span>
                  </div>
                  <Plus className="ml-auto h-4 w-4 shrink-0 text-primary" />
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {rules.length === 0 ? (
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
          Adj hozzá legalább egy terméket.
        </p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <CouponProductRuleRow
              key={`${rule.product}-${rule.variantId || "all"}-${index}`}
              rule={rule}
              rules={rules}
              onChange={(patch) => updateRule(index, patch)}
              onRemove={() => removeRule(index)}
              onAddVariantRule={addVariantRule}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CouponProductRuleRow({
  rule,
  rules,
  onChange,
  onRemove,
  onAddVariantRule,
}: {
  rule: CouponProductRuleDraft
  rules: CouponProductRuleDraft[]
  onChange: (patch: Partial<CouponProductRuleDraft>) => void
  onRemove: () => void
  onAddVariantRule: (productId: string, productName: string, variantId: string) => void
}) {
  const [variants, setVariants] = React.useState<Array<{ id: string; label: string }>>([])
  const [loadingVariants, setLoadingVariants] = React.useState(false)
  const [displayName, setDisplayName] = React.useState(rule.productName || "")

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingVariants(true)
      try {
        const product = await getProductForCouponRule(rule.product)
        if (cancelled || !product) return
        setDisplayName(product.name)
        setVariants(product.variants)
      } finally {
        if (!cancelled) setLoadingVariants(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [rule.product])

  const usedVariantIds = new Set(
    rules
      .filter((entry) => entry.product === rule.product && entry.variantId)
      .map((entry) => entry.variantId as string)
  )
  const unusedVariants = variants.filter((variant) => !usedVariantIds.has(variant.id))
  const canAddVariantRule = unusedVariants.length > 0

  return (
    <div className="border border-white/10 bg-white/3 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">{displayName || rule.productName || "Termék"}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
            {rule.variantId
              ? variants.find((variant) => variant.id === rule.variantId)?.label || "Egy variáns"
              : "Minden variáns / alap termék"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {variants.length > 0 ? (
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
            Variáns
          </Label>
          <select
            value={rule.variantId || ""}
            onChange={(e) => onChange({ variantId: e.target.value || undefined })}
            disabled={loadingVariants}
            className="w-full h-10 bg-black border border-white/10 px-3 text-sm text-white rounded-none"
          >
            <option value="">Minden variáns</option>
            {variants.map((variant) => {
              const takenByOther = rules.some(
                (entry) =>
                  entry.product === rule.product &&
                  entry.variantId === variant.id &&
                  ruleKey(entry) !== ruleKey(rule)
              )
              return (
                <option key={variant.id} value={variant.id} disabled={takenByOther}>
                  {variant.label}
                  {takenByOther ? " (már használt)" : ""}
                </option>
              )
            })}
          </select>
          {canAddVariantRule ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onAddVariantRule(rule.product, displayName || rule.productName || "Termék", unusedVariants[0].id)
              }
              className="h-8 px-0 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-transparent hover:text-primary/80"
            >
              <Plus className="mr-1 h-3 w-3" />
              További variáns szabály
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
            Mód
          </Label>
          <div className="flex gap-1 p-1 bg-white/5 border border-white/10">
            {(["percentage", "fixed_net", "fixed_gross"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ mode })}
                className={cn(
                  "flex-1 py-2 text-[7px] font-black uppercase tracking-widest transition-all",
                  rule.mode === mode ? "bg-primary text-white" : "text-neutral-500 hover:text-white"
                )}
              >
                {mode === "percentage" ? "%" : mode === "fixed_net" ? "NET" : "BRUT"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
            {MODE_LABELS[rule.mode]}
          </Label>
          <Input
            type="number"
            min={0}
            step={rule.mode === "percentage" ? 1 : 1}
            value={rule.value}
            onChange={(e) => onChange({ value: parseFloat(e.target.value) || 0 })}
            className="bg-black border-white/5 h-10 text-white rounded-none"
          />
        </div>
      </div>
    </div>
  )
}
