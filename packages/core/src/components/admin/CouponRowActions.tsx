"use client"

import * as React from "react"
import { Edit2, Trash2 } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { CouponDialog, type CouponFormValues } from "@wse/core/components/admin/CouponDialog"
import { deleteCoupon, updateCoupon } from "@wse/core/actions/admin-checkout"

type CouponRow = {
  _id: string
  code: string
  type: string
  value: number
  minCartValue?: number
  startDate: string | Date
  endDate: string | Date
  maxUses?: number | null
  maxUsesPerUser?: number | null
  isActive: boolean
  productPriceRules?: Array<{
    product: string | { toString(): string }
    variantId?: string
    mode: "percentage" | "fixed_net" | "fixed_gross"
    value: number
  }>
}

function mapCouponToFormValues(coupon: CouponRow): CouponFormValues {
  const type =
    coupon.type === "fixed_amount"
      ? "fixed"
      : coupon.type === "free_shipping"
        ? "free_shipping"
        : coupon.type === "product_price"
          ? "product_price"
          : "percentage"

  return {
    code: coupon.code,
    type,
    value: Number(coupon.value || 0),
    minCartValue: Number(coupon.minCartValue || 0),
    startDate: new Date(coupon.startDate).toISOString(),
    endDate: new Date(coupon.endDate).toISOString(),
    maxUses: coupon.maxUses ?? null,
    maxUsesPerUser: coupon.maxUsesPerUser ?? null,
    isActive: coupon.isActive !== false,
    productPriceRules: (coupon.productPriceRules || []).map((rule) => ({
      product: String(rule.product),
      variantId: rule.variantId,
      mode: rule.mode,
      value: Number(rule.value || 0),
    })),
  }
}

export function CouponRowActions({ coupon }: { coupon: CouponRow }) {
  const initialValues = React.useMemo(() => mapCouponToFormValues(coupon), [coupon])

  return (
    <div className="flex flex-col items-end gap-2">
      <CouponDialog
        title="KUPON SZERKESZTÉSE"
        submitLabel="VÁLTOZÁSOK MENTÉSE"
        initialValues={initialValues}
        action={updateCoupon.bind(null, coupon._id)}
      >
        <Button
          type="button"
          variant="ghost"
          className="h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md text-xs font-medium text-muted-foreground"
        >
          <Edit2 className="w-4 h-4 mr-2" /> SZERKESZTÉS
        </Button>
      </CouponDialog>
      <form action={deleteCoupon.bind(null, coupon._id)}>
        <Button
          type="submit"
          variant="ghost"
          className="h-10 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md text-xs font-medium text-muted-foreground"
        >
          <Trash2 className="w-4 h-4 mr-2" /> TÖRLÉS
        </Button>
      </form>
    </div>
  )
}
