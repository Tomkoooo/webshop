"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

export function ChromeAuthActions({
  shopEnabled,
  cmsChromePreview,
}: {
  shopEnabled?: boolean
  cmsChromePreview?: boolean
}) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  if (cmsChromePreview) {
    return <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</span>
  }

  if (!shopEnabled && !isAdmin) return null

  return (
    <div className="flex items-center gap-3">
      {shopEnabled ? (
        <Link href="/profile" className="text-xs font-medium uppercase tracking-widest hover:opacity-60">
          Account
        </Link>
      ) : null}
      {isAdmin ? (
        <Link href="/admin" className="text-xs font-medium uppercase tracking-widest hover:opacity-60">
          Admin
        </Link>
      ) : null}
    </div>
  )
}
