"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

type ChromeAuthActionsProps = {
  cmsChromePreview?: boolean
}

/** Staff entry points — low-contrast footer links. */
export function ChromeAuthActions({ cmsChromePreview }: ChromeAuthActionsProps) {
  const { data: session, status } = useSession()

  if (status === "loading" || cmsChromePreview) {
    return null
  }

  const linkClass =
    "text-[10px] normal-case tracking-normal text-muted-foreground/25 hover:text-muted-foreground/60 focus-visible:text-muted-foreground/60 focus-visible:outline-none transition-colors"

  if (session?.user?.role === "ADMIN") {
    return (
      <Link href="/admin" className={linkClass}>
        admin
      </Link>
    )
  }

  return (
    <Link href="/auth/admin-login" className={linkClass}>
      login
    </Link>
  )
}
