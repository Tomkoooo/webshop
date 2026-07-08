import { cn } from "@wse/core/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-white/5", className)}
      {...props}
    />
  )
}

export { Skeleton }
