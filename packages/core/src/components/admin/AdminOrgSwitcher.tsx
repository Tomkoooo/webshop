"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, ChevronDown } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@wse/core/components/ui/dropdown-menu"
import { tbookOrgApi } from "@wse/plugin-t-book/admin/org-api"

export function AdminOrgSwitcher({
  activeOrganizationId,
  organizationIds,
}: {
  activeOrganizationId?: string
  organizationIds: string[]
}) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<
    { id: string; name: string; slug: string }[]
  >([])
  const [activeName, setActiveName] = useState("Szervezet")

  useEffect(() => {
    if (organizationIds.length === 0) return
    void tbookOrgApi.myOrganizations().then((res) => {
      setOrganizations(res.organizations)
      const active = res.organizations.find((o) => o.id === activeOrganizationId)
      if (active) setActiveName(active.name)
    })
  }, [activeOrganizationId, organizationIds.length])

  if (organizationIds.length === 0) return null

  async function switchTo(id: string) {
    await tbookOrgApi.switchOrg(id)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[12rem] truncate">
          <Building2 className="size-4 shrink-0" />
          <span className="truncate">{activeName}</span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => void switchTo(org.id)}>
            {org.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => router.push("/admin/org/select")}>
          Szervezet váltás…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
