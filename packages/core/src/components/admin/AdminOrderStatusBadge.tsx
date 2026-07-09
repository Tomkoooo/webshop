import { Badge } from "@wse/core/components/ui/badge"
import { cn } from "@wse/core/lib/utils"
import { adminOrderStatusClass } from "@wse/core/lib/admin-ui"

const STATUS_LABELS: Record<string, string> = {
  pending: "Függőben",
  processing: "Feldolgozás alatt",
  shipped: "Szállítva",
  delivered: "Kézbesítve",
  cancelled: "Törölve",
}

export function AdminOrderStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", adminOrderStatusClass(status), className)}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
