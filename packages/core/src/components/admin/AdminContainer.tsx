import { cn } from "@wse/core/lib/utils"

export function AdminContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("w-full p-4 md:container md:mx-auto", className)}>{children}</div>
}
