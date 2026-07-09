import { Badge } from "@wse/core/components/ui/badge"
import { adminOrderStatusClass } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

export function AdminStatusBadge({
  status,
  label,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(adminOrderStatusClass(status), "border-0", className)}>
      {label ?? status}
    </Badge>
  )
}
