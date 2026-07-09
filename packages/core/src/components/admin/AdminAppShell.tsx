"use client"

import type { ReactNode } from "react"
import { AdminHeader } from "@wse/core/components/admin/AdminHeader"
import { AdminThemeProvider } from "@wse/core/components/admin/AdminThemeProvider"
import { SidebarInset, SidebarProvider } from "@wse/core/components/ui/sidebar"
import { adminShell } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

export function AdminAppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode
  children: ReactNode
}) {
  return (
    <AdminThemeProvider>
      <div className={cn(adminShell, "admin-shell min-h-[calc(100*var(--dvh))]")}>
        <SidebarProvider className="h-[calc(100*var(--dvh))] max-h-[calc(100*var(--dvh))] w-full max-w-full overflow-hidden">
          {sidebar}
          <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AdminHeader />
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </AdminThemeProvider>
  )
}
