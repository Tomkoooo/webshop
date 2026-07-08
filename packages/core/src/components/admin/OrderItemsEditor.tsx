"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  addOrderItem,
  getOrderAddableProducts,
  removeOrderItem,
} from "@wse/core/actions/admin-orders"
import type { OrderAddableProduct } from "@wse/core/lib/order-items-edit"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import {
  clampVatPercent,
  DEFAULT_VAT_PERCENT,
  formatHuf,
  priceBreakdownFromGross,
} from "@wse/core/lib/pricing"

const inputClass =
  "h-10 w-full bg-black border border-white/10 px-3 text-sm text-white placeholder:text-neutral-600 rounded-none focus:border-primary/60 focus:outline-none"
const labelClass = "text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-1 block"

type OrderItem = {
  name: string
  quantity: number
  variantLabel?: string
  price: number
  vatPercent?: number
}

type OrderItemsEditorProps = {
  orderId: string
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  editable?: boolean
  invoiceIssued?: boolean
  onSaved?: () => void
}

export function OrderItemsEditor({
  orderId,
  items,
  subtotal,
  shippingFee,
  discount,
  total,
  editable = true,
  invoiceIssued = false,
  onSaved,
}: OrderItemsEditorProps) {
  const router = useRouter()
  const [products, setProducts] = useState<OrderAddableProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const selectedProduct = products.find((product) => product.id === selectedProductId)

  const loadProducts = useCallback(async () => {
    if (!editable) return
    setProductsLoading(true)
    try {
      const list = await getOrderAddableProducts()
      setProducts(list)
    } catch {
      toast.error("Nem sikerült betölteni a termékeket.")
    } finally {
      setProductsLoading(false)
    }
  }, [editable])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    setSelectedVariantId("")
    setQuantity(1)
  }, [selectedProductId])

  const handleRemove = async (index: number) => {
    if (!editable || removingIndex != null) return
    if (!window.confirm("Biztosan törlöd ezt a tételt a rendelésből?")) return

    setRemovingIndex(index)
    try {
      await removeOrderItem(orderId, index)
      toast.success("Tétel törölve.")
      onSaved?.()
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "A törlés sikertelen."
      toast.error(message)
    } finally {
      setRemovingIndex(null)
    }
  }

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editable || adding || !selectedProductId) return

    if (selectedProduct?.requiresVariant && !selectedVariantId) {
      toast.error("Válassz variánst.")
      return
    }

    setAdding(true)
    try {
      await addOrderItem(orderId, {
        productId: selectedProductId,
        variantId: selectedVariantId || undefined,
        quantity,
      })
      toast.success("Tétel hozzáadva.")
      setSelectedProductId("")
      setSelectedVariantId("")
      setQuantity(1)
      onSaved?.()
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "A hozzáadás sikertelen."
      toast.error(message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {invoiceIssued ? (
        <p className="border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-300">
          A rendeléshez már kiállított számla tartozik — a tételek módosítása után ellenőrizd a számlázást.
        </p>
      ) : null}

      <div className="space-y-3">
        {items.map((item, index) => {
          const breakdown = priceBreakdownFromGross(
            item.price,
            item.quantity,
            clampVatPercent(item.vatPercent ?? DEFAULT_VAT_PERCENT)
          )
          const isLimitedLine = item.name.toLowerCase().includes("limitált")

          return (
            <div
              key={`${index}-${item.name}`}
              className="flex gap-4 border border-white/5 bg-black/40 p-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/10 bg-neutral-950">
                <Package className="h-5 w-5 text-neutral-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-sm font-black uppercase tracking-wider text-white">
                    {item.name}
                  </p>
                  {isLimitedLine ? (
                    <span className="border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-300">
                      Limitált ár
                    </span>
                  ) : null}
                </div>
                {item.variantLabel ? (
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    {item.variantLabel}
                  </p>
                ) : null}
                <p className="text-[10px] text-neutral-600">{item.quantity} db</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-right">
                  <p className="font-black text-white">{formatHuf(breakdown.lineGross)}</p>
                  <p className="text-[9px] text-neutral-600">{formatHuf(breakdown.unitGross)} / db</p>
                </div>
                {editable ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={items.length <= 1 || removingIndex != null}
                    onClick={() => void handleRemove(index)}
                    className="h-9 w-9 shrink-0 rounded-none text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    title="Tétel törlése"
                  >
                    {removingIndex === index ? (
                      <LoadingSpinner size="xs" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-2 border-t border-white/5 pt-4 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Részösszeg</span>
          <span>{formatHuf(subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Szállítás</span>
          <span>{shippingFee === 0 ? "INGYENES" : formatHuf(shippingFee)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-highlight">
            <span>Kedvezmény</span>
            <span>-{formatHuf(discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-white/5 pt-2 text-base font-black uppercase text-white">
          <span>Végösszeg</span>
          <span className="admin-headline-accent">{formatHuf(total)}</span>
        </div>
      </div>

      {editable ? (
        <form onSubmit={(event) => void handleAdd(event)} className="border border-white/10 bg-black/30 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">
            Új tétel hozzáadása
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor={`add-product-${orderId}`}>
                Termék
              </label>
              <select
                id={`add-product-${orderId}`}
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={adding || productsLoading}
                className={inputClass}
              >
                <option value="">Válassz terméket…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.requiresVariant
                      ? ` (${product.variants.length} variáns)`
                      : ` — ${product.stock} db`}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct?.requiresVariant ? (
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor={`add-variant-${orderId}`}>
                  Variáns
                </label>
                <select
                  id={`add-variant-${orderId}`}
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  disabled={adding}
                  className={inputClass}
                  required
                >
                  <option value="">Válassz variánst…</option>
                  {selectedProduct.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label} — {variant.stock} db
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className={labelClass} htmlFor={`add-qty-${orderId}`}>
                Mennyiség
              </label>
              <input
                id={`add-qty-${orderId}`}
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                disabled={adding}
                className={inputClass}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={adding || !selectedProductId || productsLoading}
            className="mt-4 h-10 rounded-none bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
          >
            {adding ? <LoadingSpinner size="xs" className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
            Tétel hozzáadása
          </Button>
        </form>
      ) : null}
    </div>
  )
}
