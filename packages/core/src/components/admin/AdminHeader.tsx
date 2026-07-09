"use client"

import Link from "next/link"
import { useLayoutEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@wse/core/components/ui/breadcrumb"
import { SidebarTrigger } from "@wse/core/components/ui/sidebar"
import { Separator } from "@wse/core/components/ui/separator"
import { AdminContainer } from "@wse/core/components/admin/AdminContainer"
import { AdminThemeToggle } from "@wse/core/components/admin/AdminThemeToggle"
import { translateAdminBreadcrumbSegment } from "@wse/core/lib/admin-breadcrumbs"

export function AdminHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const list = el.querySelector("ol")
    if (list) list.scrollLeft = list.scrollWidth
  }, [segments.length])

  return (
    <AdminContainer className="z-20 shrink-0 bg-background pb-0">
      <div className="flex flex-row items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 hidden h-4 md:block" />
        <Breadcrumb className="admin-breadcrumb-scroll min-w-0 flex-1 overflow-x-auto" ref={ref}>
          <BreadcrumbList className="flex flex-nowrap items-center gap-2">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Vezérlőpult</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {segments.slice(1).map((segment, index) => {
              const href = `/admin/${segments.slice(1, index + 2).join("/")}`
              const isLast = index === segments.slice(1).length - 1
              return (
                <span key={href} className="flex items-center gap-2">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{translateAdminBreadcrumbSegment(segment)}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{translateAdminBreadcrumbSegment(segment)}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <AdminThemeToggle />
      </div>
      <Separator className="mt-4" />
    </AdminContainer>
  )
}
