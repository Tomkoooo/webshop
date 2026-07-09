import Link from "next/link"
import { Banknote, Package, ShoppingCart } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { AdminDataTable, type AdminDataTableColumn } from "@wse/core/components/admin/AdminDataTable"
import { AdminFilterBar } from "@wse/core/components/admin/AdminFilterBar"
import { AdminKpiCard } from "@wse/core/components/admin/AdminKpiCard"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import type { DailyIncomeRow, DailyProductRow } from "@wse/core/lib/admin-stats-types"
import type { AdminStatsDatePreset } from "@wse/core/lib/admin-stats-date-range"
import { adminFilterInput, adminSectionTitle } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
import { format } from "date-fns"
import { hu } from "date-fns/locale"

type AdminDailyStatsSectionProps = {
  range: {
    preset: AdminStatsDatePreset
    dateFrom: string
    dateTo: string
    label: string
  }
  summary: {
    revenue: number
    orders: number
    unitsSold: number
  }
  dailyIncome: DailyIncomeRow[]
  dailyProducts: DailyProductRow[]
}

const PRESETS: Array<{ id: AdminStatsDatePreset; label: string }> = [
  { id: "today", label: "Ma" },
  { id: "week", label: "Ez a hét" },
  { id: "month", label: "Aktuális hónap" },
]

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("hu-HU")} Ft`
}

function formatDisplayDate(dateKey: string) {
  return format(new Date(`${dateKey}T12:00:00`), "yyyy.MM.dd (EEEE)", { locale: hu })
}

function presetHref(preset: AdminStatsDatePreset) {
  return `/admin/stats?preset=${preset}`
}

const incomeColumns: AdminDataTableColumn<DailyIncomeRow>[] = [
  {
    id: "date",
    header: "Dátum",
    cell: (row) => <span className="font-medium">{formatDisplayDate(row.date)}</span>,
  },
  {
    id: "orders",
    header: "Rendelések",
    cell: (row) => <span className="tabular-nums">{row.orders}</span>,
  },
  {
    id: "revenue",
    header: "Bevétel",
    headerClassName: "text-right",
    className: "text-right font-semibold tabular-nums",
    cell: (row) => formatCurrency(row.revenue),
  },
]

export function AdminDailyStatsSection({
  range,
  summary,
  dailyIncome,
  dailyProducts,
}: AdminDailyStatsSectionProps) {
  const productsByDate = new Map<string, DailyProductRow[]>()
  for (const row of dailyProducts) {
    const existing = productsByDate.get(row.date) || []
    existing.push(row)
    productsByDate.set(row.date, existing)
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className={adminSectionTitle}>Napi részletek</h2>
        <p className="text-sm text-muted-foreground">
          Napi bevétel és termékértékesítés az alábbi időszakra: {range.label}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-1">
        {PRESETS.map((preset) => (
          <Link
            key={preset.id}
            href={presetHref(preset.id)}
            className={cn(
              "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors",
              range.preset === preset.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            )}
          >
            {preset.label}
          </Link>
        ))}
      </div>

      <AdminFilterBar method="get" action="/admin/stats">
        <input type="hidden" name="preset" value="custom" />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="stats-date-from" className="text-sm font-medium text-foreground">
            Kezdő dátum
          </label>
          <input
            id="stats-date-from"
            type="date"
            name="dateFrom"
            defaultValue={range.dateFrom}
            className={adminFilterInput}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="stats-date-to" className="text-sm font-medium text-foreground">
            Záró dátum
          </label>
          <input
            id="stats-date-to"
            type="date"
            name="dateTo"
            defaultValue={range.dateTo}
            className={adminFilterInput}
          />
        </div>
        <Button type="submit" className="h-10">
          Szűrés
        </Button>
      </AdminFilterBar>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminKpiCard title="Bevétel" value={formatCurrency(summary.revenue)} icon={Banknote} />
        <AdminKpiCard title="Rendelések" value={String(summary.orders)} icon={ShoppingCart} />
        <AdminKpiCard title="Eladott darab" value={String(summary.unitsSold)} icon={Package} />
      </div>

      <AdminPanel title="Napi bevétel">
        <AdminDataTable
          columns={incomeColumns}
          rows={dailyIncome}
          getRowKey={(row) => row.date}
          emptyMessage="Nincs adat a kiválasztott időszakra."
          rowClassName={() => "border-0"}
        />
      </AdminPanel>

      <div className="flex flex-col gap-4">
        <h3 className={adminSectionTitle}>Napi termékértékesítés</h3>
        <div className="flex flex-col gap-4">
          {dailyIncome.map((day) => {
            const products = productsByDate.get(day.date) || []
            const productColumns: AdminDataTableColumn<DailyProductRow>[] = [
              {
                id: "name",
                header: "Termék",
                cell: (product) => <span className="font-medium">{product.productName}</span>,
              },
              {
                id: "qty",
                header: "Db",
                cell: (product) => <span className="tabular-nums">{product.soldQuantity}</span>,
              },
              {
                id: "revenue",
                header: "Bevétel",
                headerClassName: "text-right",
                className: "text-right font-semibold tabular-nums",
                cell: (product) => formatCurrency(product.revenue),
              },
            ]

            return (
              <Card key={day.date} className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">{formatDisplayDate(day.date)}</CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nincs eladás</p>
                  ) : (
                    <AdminDataTable
                      columns={productColumns}
                      rows={products}
                      getRowKey={(product) => `${product.date}-${product.productId}`}
                      rowClassName={() => "border-0"}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
