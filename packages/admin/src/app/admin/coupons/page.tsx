import * as React from "react"
import dbConnect from "@wse/core/lib/db"
import Coupon from "@wse/core/models/Coupon"
import { Plus, Tag, Calendar, Users, ShoppingBag } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { deleteCoupon, createCoupon } from "@wse/core/actions/admin-checkout"
import { CouponDialog } from "@wse/core/components/admin/CouponDialog"
import { CouponRowActions } from "@wse/core/components/admin/CouponRowActions"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge"

export default async function AdminCouponsPage() {
  await dbConnect()
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean()

  return (
    <AdminPageScaffold
      title="Kuponok"
      description="Kedvezményes kódok és promóciók beállítása."
      actions={
        <CouponDialog title="Új kupon létrehozása" action={createCoupon}>
          <Button>
            <Plus className="size-4" />
            Új kupon
          </Button>
        </CouponDialog>
      }
    >
      <div className="grid grid-cols-1 gap-6">
        {coupons.map((coupon: any) => (
          <Card key={coupon._id} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                <div className="flex items-center gap-6">
                  <div className="admin-icon-well flex size-16 items-center justify-center">
                    <Tag className="size-8 text-primary" />
                  </div>
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold">{coupon.code}</h3>
                      <AdminStatusBadge
                        status={coupon.isActive ? "active" : "cancelled"}
                        label={coupon.isActive ? "Aktív" : "Inaktív"}
                      />
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {coupon.type === "percentage" ? `${coupon.value}% kedvezmény` :
                       coupon.type === "fixed_amount" ? `${coupon.value.toLocaleString("hu-HU")} Ft kedvezmény` :
                       coupon.type === "product_price" ? (
                         `${(coupon.productPriceRules || []).length} termékáras szabály`
                       ) :
                       "Ingyenes szállítás"}
                    </p>
                    {coupon.type === "product_price" && Array.isArray(coupon.productPriceRules) && coupon.productPriceRules.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {coupon.productPriceRules.map((rule: { mode: string; value: number; variantId?: string }, i: number) => (
                          <span key={i}>
                            {i > 0 ? " · " : ""}
                            {rule.mode === "percentage" ? `${rule.value}%` : rule.mode === "fixed_net" ? `${rule.value} Ft nettó` : `${rule.value} Ft bruttó`}
                            {rule.variantId ? " (1 variáns)" : " (összes variáns)"}
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid max-w-3xl flex-grow grid-cols-2 gap-8 md:grid-cols-4">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Calendar className="size-3" /> Időszak
                    </p>
                    <p className="whitespace-nowrap text-sm">
                      {new Date(coupon.startDate).toLocaleDateString("hu-HU")} – {new Date(coupon.endDate).toLocaleDateString("hu-HU")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <ShoppingBag className="size-3" /> Min. kosár
                    </p>
                    <p className="text-sm">
                      {coupon.minCartValue ? `${coupon.minCartValue.toLocaleString("hu-HU")} Ft` : "Nincs"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Users className="size-3" /> Felhasználás
                    </p>
                    <p className="text-sm">
                      {coupon.usedCount} / {coupon.maxUses || "∞"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      E-mail limit: {coupon.maxUsesPerUser || "∞"}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <CouponRowActions
                      coupon={{
                        ...coupon,
                        _id: coupon._id.toString(),
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {coupons.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="py-20 text-center">
              <Tag className="mx-auto mb-6 size-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nincsenek létrehozott kuponok</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageScaffold>
  )
}
