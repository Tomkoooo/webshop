"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { isShopEnabled } from "@wse/core/lib/features/shop"

function AdminLoginPageContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")?.trim() || "/admin"
  const [pending, setPending] = React.useState(false)
  const shopEnabled = isShopEnabled()

  const handleSignIn = () => {
    setPending(true)
    void signIn("google", { callbackUrl }, { prompt: "select_account" })
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-md text-center">
        <h1 className="mb-4 text-2xl font-heading font-black uppercase tracking-[0.2em] italic">
          Admin bejelentkezés
        </h1>
        <p className="mb-8 text-sm text-neutral-400 leading-relaxed">
          Válassz Google-fiókot admin hozzáféréssel. Ha eddig másik fiókkal voltál bejelentkezve, itt
          kiválaszthatod a megfelelőt.
        </p>
        <Button
          type="button"
          disabled={pending}
          onClick={handleSignIn}
          className="mb-6 h-14 w-full rounded-none font-black uppercase tracking-widest text-[10px]"
          variant="krausz"
        >
          {pending ? "Átirányítás…" : "Bejelentkezés Google-lel"}
        </Button>
        <Link
          href="/"
          className="block text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
        >
          Vissza a weboldalra
        </Link>
        {shopEnabled ? (
          <Link
            href="/shop"
            className="mt-4 block text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            Webshop
          </Link>
        ) : null}
      </div>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0A0A0B] pt-32">
          <LoadingSpinner />
        </main>
      }
    >
      <AdminLoginPageContent />
    </React.Suspense>
  )
}
