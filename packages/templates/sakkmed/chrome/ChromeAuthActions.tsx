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
    return <span className="text-xs text-muted-foreground">Admin / Bejelentkezés</span>
  }

  return (
    <div className="flex items-center gap-3">
      {shopEnabled ? (
        <Link href="/profile" className="text-sm font-medium hover:text-primary">
          Fiókom
        </Link>
      ) : null}
      {isAdmin ? (
        <Link href="/admin" className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
          Admin
        </Link>
      ) : (
        <Link href="/api/auth/signin" className="text-sm font-medium hover:text-primary">
          Bejelentkezés
        </Link>
      )}
    </div>
  )
}
