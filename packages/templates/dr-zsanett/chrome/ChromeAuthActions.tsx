"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

type Props = {
  cmsChromePreview?: boolean
}

export function ChromeAuthActions({ cmsChromePreview }: Props) {
  const { data: session, status } = useSession()

  if (status === "loading" || cmsChromePreview) return null

  const linkClass =
    "text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:text-foreground"

  if (session?.user?.role === "ADMIN") {
    return (
      <Link href="/admin" className={linkClass}>
        Admin
      </Link>
    )
  }

  return (
    <Link href="/auth/admin-login" className={linkClass}>
      Belépés
    </Link>
  )
}
