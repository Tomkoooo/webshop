"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

type Copy = {
  loadingText: string
  successTitle: string
  successBody: string
  successCta: string
  errorBody: string
  errorCta: string
}

export function TBookSuccessClient({ copy, apiBase }: { copy: Copy; apiBase?: string }) {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")
  const sessionId = searchParams.get("session_id")
  const shouldPoll = Boolean(bookingId || sessionId)
  const [status, setStatus] = useState<"loading" | "paid" | "error">(
    shouldPoll ? "loading" : "paid"
  )

  useEffect(() => {
    if (!shouldPoll) return
    const base = apiBase?.replace(/\/$/, "") ?? "/api/plugins/t-book"
    const qs = new URLSearchParams()
    if (bookingId) qs.set("bookingId", bookingId)
    if (sessionId) qs.set("session_id", sessionId)
    void fetch(`${base}/bookings/status?${qs}`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; status?: string }) => {
        if (data.ok && (data.status === "paid" || data.status === "confirmed")) {
          setStatus("paid")
        } else {
          setStatus("error")
        }
      })
      .catch(() => setStatus("error"))
  }, [bookingId, sessionId, apiBase, shouldPoll])

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p>{copy.loadingText}</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{copy.errorBody}</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {copy.errorCta}
        </Link>
      </div>
    )
  }

  const body = copy.successBody.replace("{bookingId}", bookingId ?? "—")

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">{copy.successTitle}</h1>
      <p className="mt-3 text-muted-foreground">{body}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {copy.successCta}
      </Link>
    </div>
  )
}
