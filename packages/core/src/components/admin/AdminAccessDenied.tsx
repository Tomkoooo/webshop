"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@wse/core/components/ui/button"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { adminPageTitle } from "@wse/core/lib/admin-ui"

export function AdminAccessDenied({ email }: { email?: string | null }) {
  const shopEnabled = isShopEnabled()

  const switchAccount = () => {
    void signOut({ callbackUrl: "/auth/admin-login" })
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-16 text-center">
      <div className="space-y-3">
        <h1 className={adminPageTitle}>Nincs admin jogosultság</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {email ? (
            <>
              A(z) <span className="font-medium text-foreground">{email}</span> fiókkal vagy bejelentkezve,
              de ez a felhasználó nem rendelkezik admin hozzáféréssel.
            </>
          ) : (
            <>A bejelentkezett fiók nem rendelkezik admin hozzáféréssel.</>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Jelentkezz be egy másik Google-fiókkal, amelyhez admin jog van rendelve.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="button" onClick={switchAccount} className="h-12 w-full">
          Bejelentkezés másik Google-fiókkal
        </Button>
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Vissza a weboldalra
        </Link>
        {!shopEnabled ? (
          <Link
            href="/profile"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ügyfélprofil
          </Link>
        ) : null}
      </div>
    </div>
  )
}
