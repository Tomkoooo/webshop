import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import type { DailyIncomeRow, DailyProductRow } from "@wse/core/lib/admin-stats-types"
import type { AdminStatsDatePreset } from "@wse/core/lib/admin-stats-date-range"
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
    <section className="space-y-6 bg-white/5 border border-white/10 p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Napi részletek</h2>
        <p className="text-white/40 font-medium italic">
          Napi bevétel és termékértékesítés az alábbi időszakra: {range.label}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Link
            key={preset.id}
            href={presetHref(preset.id)}
            className={`inline-flex h-10 items-center px-4 text-[10px] font-black uppercase tracking-widest border transition-colors ${
              range.preset === preset.id
                ? "bg-primary border-primary text-white"
                : "bg-black border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
            }`}
          >
            {preset.label}
          </Link>
        ))}
      </div>

      <form
        method="get"
        action="/admin/stats"
        className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-4"
      >
        <input type="hidden" name="preset" value="custom" />
        <input
          type="date"
          name="dateFrom"
          defaultValue={range.dateFrom}
          className="h-12 bg-black border border-white/10 px-4 text-sm text-white rounded-none"
        />
        <input
          type="date"
          name="dateTo"
          defaultValue={range.dateTo}
          className="h-12 bg-black border border-white/10 px-4 text-sm text-white rounded-none"
        />
        <Button
          type="submit"
          className="h-12 rounded-none bg-primary font-black uppercase tracking-widest text-[10px] text-white hover:bg-primary/80"
        >
          Szűrés
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Bevétel</p>
          <p className="mt-2 text-2xl font-black text-white">{formatCurrency(summary.revenue)}</p>
        </div>
        <div className="border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Rendelések</p>
          <p className="mt-2 text-2xl font-black text-white">{summary.orders}</p>
        </div>
        <div className="border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Eladott darab</p>
          <p className="mt-2 text-2xl font-black text-white">{summary.unitsSold}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-white">Napi bevétel</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                <th className="py-2 pr-4 font-black">Dátum</th>
                <th className="py-2 pr-4 font-black">Rendelések</th>
                <th className="py-2 font-black text-right">Bevétel</th>
              </tr>
            </thead>
            <tbody>
              {dailyIncome.map((row) => (
                <tr key={row.date} className="border-b border-white/5">
                  <td className="py-3 pr-4 font-bold text-neutral-300">{formatDisplayDate(row.date)}</td>
                  <td className="py-3 pr-4 text-white">{row.orders}</td>
                  <td className="py-3 text-right font-black admin-value">{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-white">Napi termékértékesítés</h3>
        <div className="space-y-4">
          {dailyIncome.map((day) => {
            const products = productsByDate.get(day.date) || []
            return (
              <div key={day.date} className="border border-white/10 bg-black/20">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="font-black uppercase tracking-wide text-white">{formatDisplayDate(day.date)}</p>
                </div>
                {products.length === 0 ? (
                  <p className="px-4 py-3 text-sm italic text-neutral-500">Nincs eladás</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[24rem] text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-widest text-neutral-500">
                          <th className="px-4 py-2 font-black">Termék</th>
                          <th className="px-4 py-2 font-black">Db</th>
                          <th className="px-4 py-2 font-black text-right">Bevétel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={`${product.date}-${product.productId}`} className="border-b border-white/5">
                            <td className="px-4 py-2 font-bold text-white">{product.productName}</td>
                            <td className="px-4 py-2 text-neutral-300">{product.soldQuantity}</td>
                            <td className="px-4 py-2 text-right font-black admin-value">
                              {formatCurrency(product.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
