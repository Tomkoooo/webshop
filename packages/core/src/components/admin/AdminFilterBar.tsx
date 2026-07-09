import type { FormHTMLAttributes, ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { adminFilterBar, adminFilterInput } from "@wse/core/lib/admin-ui"

export function AdminFilterBar({
  children,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form className={cn(adminFilterBar, className)} {...props}>
      {children}
    </form>
  )
}

export function AdminFilterInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return <input className={cn(adminFilterInput, className)} {...props} />
}

export function AdminFilterSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return <select className={cn(adminFilterInput, className)} {...props} />
}
