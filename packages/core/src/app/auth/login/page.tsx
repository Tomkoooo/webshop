"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

function LoginPageContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")?.trim() || "/profile"
  const [pending, setPending] = React.useState(false)

  const handleSignIn = () => {
    setPending(true)
    void signIn("google", { callbackUrl })
  }

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-md text-center">
        <h1 className="mb-4 text-2xl font-black uppercase tracking-[0.2em] text-foreground">Bejelentkezés</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Jelentkezz be Google-fiókkal a rendeléseid és profilod eléréséhez. Vendég rendelés esetén ugyanazzal az
          e-mail címmel a korábbi rendeléseid automatikusan megjelennek.
        </p>
        <Button
          type="button"
          disabled={pending}
          onClick={handleSignIn}
          className="mb-6 h-14 w-full rounded-none font-black uppercase tracking-widest text-xs"
        >
          {pending ? "Átirányítás…" : "Bejelentkezés Google-lel"}
        </Button>
        <Link href="/shop" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
          Vissza a webshopba
        </Link>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center pt-32">
          <LoadingSpinner />
        </main>
      }
    >
      <LoginPageContent />
    </React.Suspense>
  )
}
