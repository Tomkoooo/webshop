import * as React from "react"
import dbConnect from "@wse/core/lib/db"
import PaymentMethod from "@wse/core/models/PaymentMethod"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardFooter } from "@wse/core/components/ui/card"
import {
  deletePaymentMethod,
  createPaymentMethod,
  updatePaymentMethod
} from "@wse/core/actions/admin-checkout"
import { MethodDialog } from "@wse/core/components/admin/MethodDialog"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge"
import { formatHuf, totalsBreakdownFromGross } from "@wse/core/lib/pricing"

export default async function AdminPaymentPage() {
  await dbConnect()
  const methods = await PaymentMethod.find({}).lean()

  return (
    <AdminPageScaffold
      title="Fizetési módok"
      description="Pénztárban választható fizetési lehetőségek kezelése."
      actions={
        <MethodDialog title="Új fizetési mód" action={createPaymentMethod}>
          <Button>
            <Plus className="size-4" />
            Új hozzáadása
          </Button>
        </MethodDialog>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {methods.map((method: any) => {
          const breakdown = totalsBreakdownFromGross(method.grossPrice)
          return (
            <Card key={method._id} className="shadow-sm">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="max-w-[200px] truncate text-xl font-semibold">{method.name}</h3>
                    <p className="mt-2 text-2xl font-bold tabular-nums">{formatHuf(breakdown.gross)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Nettó {formatHuf(breakdown.net)} · ÁFA {formatHuf(breakdown.vat)}
                    </p>
                  </div>
                  <AdminStatusBadge
                    status={method.isActive ? "active" : "cancelled"}
                    label={method.isActive ? "Aktív" : "Inaktív"}
                  />
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t">
                <MethodDialog
                  title="Mód szerkesztése"
                  action={updatePaymentMethod.bind(null, method._id.toString())}
                  initialData={method}
                >
                  <Button variant="outline" className="grow">
                    <Edit2 className="size-4" />
                    Szerkesztés
                  </Button>
                </MethodDialog>
                <form action={deletePaymentMethod.bind(null, method._id.toString())}>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-600">
                    <Trash2 className="size-5" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </AdminPageScaffold>
  )
}
