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
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge"
import {
  clampVatPercent,
  DEFAULT_VAT_PERCENT,
  formatHuf,
  priceBreakdownFromGross,
} from "@wse/core/lib/pricing"
import { adminAlertWarning, adminInputClass } from "@wse/core/lib/admin-ui"

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
        <p className={adminAlertWarning}>
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
            <Card key={`${index}-${item.name}`}>
              <CardContent className="flex gap-4 p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    {isLimitedLine ? (
                      <AdminStatusBadge status="pending" label="Limitált ár" />
                    ) : null}
                  </div>
                  {item.variantLabel ? (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{item.quantity} db</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-foreground">
                      {formatHuf(breakdown.lineGross)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatHuf(breakdown.unitGross)} / db</p>
                  </div>
                  {editable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={items.length <= 1 || removingIndex != null}
                      onClick={() => void handleRemove(index)}
                      className="h-9 w-9 shrink-0 text-rose-600 hover:bg-rose-500/10 hover:text-rose-800"
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
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="space-y-2 pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Részösszeg</span>
          <span>{formatHuf(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Szállítás</span>
          <span>{shippingFee === 0 ? "INGYENES" : formatHuf(shippingFee)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-highlight">
            <span>Kedvezmény</span>
            <span>-{formatHuf(discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border/50 pt-2 text-base font-semibold text-foreground">
          <span>Végösszeg</span>
          <span className="tabular-nums">{formatHuf(total)}</span>
        </div>
      </div>

      {editable ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={(event) => void handleAdd(event)} className="space-y-4">
              <p className="text-sm font-medium text-foreground">Új tétel hozzáadása</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminFormField label="Termék" className="sm:col-span-2">
                  <select
                    id={`add-product-${orderId}`}
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    disabled={adding || productsLoading}
                    className={adminInputClass}
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
                </AdminFormField>

                {selectedProduct?.requiresVariant ? (
                  <AdminFormField label="Variáns" className="sm:col-span-2">
                    <select
                      id={`add-variant-${orderId}`}
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      disabled={adding}
                      className={adminInputClass}
                      required
                    >
                      <option value="">Válassz variánst…</option>
                      {selectedProduct.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.label} — {variant.stock} db
                        </option>
                      ))}
                    </select>
                  </AdminFormField>
                ) : null}

                <AdminFormField label="Mennyiség">
                  <input
                    id={`add-qty-${orderId}`}
                    type="number"
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    disabled={adding}
                    className={adminInputClass}
                  />
                </AdminFormField>
              </div>

              <Button type="submit" disabled={adding || !selectedProductId || productsLoading}>
                {adding ? <LoadingSpinner size="xs" className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                Tétel hozzáadása
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
