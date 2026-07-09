import type { ComponentType, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { adminKpiCard } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

type AdminKpiCardProps = {
  title: string
  value: string
  subtitle?: string
  change?: number
  trend?: "up" | "down"
  icon: ComponentType<{ className?: string }>
  className?: string
  footer?: ReactNode
}

export function AdminKpiCard({
  title,
  value,
  subtitle,
  change,
  trend,
  icon: Icon,
  className,
  footer,
}: AdminKpiCardProps) {
  return (
    <Card className={cn(adminKpiCard, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {typeof change === "number" && trend ? (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              trend === "up" ? "text-emerald-600" : "text-destructive"
            )}
          >
            {trend === "up" ? "+" : "-"}
            {Math.abs(change)}%
          </p>
        ) : null}
        {subtitle ? <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p> : null}
        {footer}
      </CardContent>
    </Card>
  )
}
