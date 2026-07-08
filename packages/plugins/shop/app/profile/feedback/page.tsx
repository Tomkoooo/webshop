"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { authLoginPath } from "@wse/core/lib/auth-redirect"
import { toast } from "sonner"
import { Star } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

export default function ShopFeedbackPage() {
  const { status } = useSession()
  const router = useRouter()

  const [rating, setRating] = React.useState(0)
  const [hoveredRating, setHoveredRating] = React.useState(0)
  const [comment, setComment] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push(authLoginPath("/profile/feedback"))
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Kérjük, válassz legalább 1 csillagot!")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/user/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      })

      if (res.ok) {
        toast.success("Köszönjük az értékelést!")
        router.push("/profile")
      } else {
        const err = await res.json()
        toast.error(err.error || "Hiba történt a küldés során")
      }
    } catch {
      toast.error("Hálózati hiba történt")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-12 duration-500 animate-in fade-in slide-in-from-right-4">
      <h2 className="mb-8 border-b border-border pb-4 text-xl font-black uppercase tracking-[0.2em] text-foreground">
        Bolt értékelése
      </h2>

      <div className="space-y-8 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div>
          <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-primary-foreground">
            Mennyire voltál elégedett a vásárlásoddal?
          </h3>
          <p className="mb-6 text-sm font-medium text-muted-foreground">
            Minden visszajelzés segít nekünk, hogy még jobb szolgáltatást és minőségibb termékeket biztosíthassunk a jövőben. Ezt a funkciót csak feldolgozott rendelés után használhatod.
          </p>

          <div className="mb-8 flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 p-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className={`h-12 w-12 cursor-pointer transition-colors ${
                  star <= (hoveredRating || rating) ? "fill-primary text-primary-foreground" : "text-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                További észrevételek (opcionális)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Írd meg nekünk a véleményed, észrevételed..."
                className="h-32 w-full resize-none rounded-lg border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-lg border border-primary-foreground/35 bg-primary font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Küldés folyamatban..." : "Értékelés beküldése"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
