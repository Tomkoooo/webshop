"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@wse/core/components/ui/button"
import { isShopEnabled } from "@wse/core/lib/features/shop"

export function AdminAccessDenied({ email }: { email?: string | null }) {
  const shopEnabled = isShopEnabled()

  const switchAccount = () => {
    void signOut({ callbackUrl: "/auth/admin-login" })
  }

  return (
    <div className="max-w-lg mx-auto py-16 space-y-8 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-heading font-black text-white uppercase italic tracking-wider">
          Nincs admin jogosultság
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          {email ? (
            <>
              A(z) <span className="text-white font-medium">{email}</span> fiókkal vagy bejelentkezve,
              de ez a felhasználó nem rendelkezik admin hozzáféréssel.
            </>
          ) : (
            <>A bejelentkezett fiók nem rendelkezik admin hozzáféréssel.</>
          )}
        </p>
        <p className="text-neutral-500 text-xs">
          Jelentkezz be egy másik Google-fiókkal, amelyhez admin jog van rendelve.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="krausz"
          onClick={switchAccount}
          className="h-12 w-full uppercase tracking-widest text-[10px] font-black"
        >
          Bejelentkezés másik Google-fiókkal
        </Button>
        <Link
          href="/"
          className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
        >
          Vissza a weboldalra
        </Link>
        {!shopEnabled ? (
          <Link
            href="/profile"
            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
          >
            Ügyfélprofil
          </Link>
        ) : null}
      </div>
    </div>
  )
}
