"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

function InviteAcceptContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { status } = useSession()
  const token = searchParams.get("token")?.trim() ?? ""
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (status !== "authenticated" || !token) return
    setPending(true)
    void fetch("/api/plugins/t-book/org/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Meghívó elfogadása sikertelen.")
        router.replace(data.redirectTo ?? "/admin/org/select")
      })
      .catch((err: Error) => {
        setError(err.message)
        setPending(false)
      })
  }, [status, token, router])

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Érvénytelen meghívó link.</p>
      </main>
    )
  }

  if (status === "loading" || pending) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </main>
    )
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Szervezeti meghívó</h1>
          <p className="mb-8 text-sm text-neutral-400">
            A meghívó elfogadásához jelentkezz be Google fiókkal.
          </p>
          <Button
            type="button"
            onClick={() => {
              const callbackUrl = `/auth/invite?token=${encodeURIComponent(token)}`
              void signIn("google", { callbackUrl }, { prompt: "select_account" })
            }}
            className="w-full"
          >
            Bejelentkezés Google-lel
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-destructive text-sm">{error ?? "Hiba történt."}</p>
    </main>
  )
}

export default function InviteAcceptPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </main>
      }
    >
      <InviteAcceptContent />
    </React.Suspense>
  )
}
