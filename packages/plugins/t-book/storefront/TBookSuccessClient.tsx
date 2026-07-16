"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { TBOOK_SAME_ORIGIN_API_BASE } from "../lib/tbook-api-base"

type Copy = {
  loadingText: string
  successTitle: string
  successBody: string
  successCta: string
  errorBody: string
  errorCta: string
}

type CheckoutStatus = {
  ok?: boolean
  status?: string
  invoiceReady?: boolean
  invoiceStatus?: string
  invoiceError?: string | null
  vouchersReady?: boolean
  eventName?: string
  returnBaseUrl?: string | null
  totalHuf?: number
  guests?: number
  error?: string
}

function checkoutQuery(bookingId: string, sessionId: string | null) {
  const qs = new URLSearchParams({ bookingId })
  if (sessionId) qs.set("session_id", sessionId)
  return qs
}

export function TBookSuccessClient({ copy }: { copy: Copy }) {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")
  const sessionId = searchParams.get("session_id")
  const returnTo = searchParams.get("return_to")
  const cancelled = searchParams.get("cancelled") === "1"
  const [status, setStatus] = useState<"loading" | "paid" | "cancelled" | "error">(
    cancelled ? "cancelled" : bookingId ? "loading" : "error"
  )
  const [checkout, setCheckout] = useState<CheckoutStatus | null>(null)
  const [pollingAssets, setPollingAssets] = useState(false)

  useEffect(() => {
    if (cancelled || !bookingId) return

    let attempts = 0
    let active = true

    const poll = async () => {
      const qs = checkoutQuery(bookingId, sessionId)
      try {
        const res = await fetch(`${TBOOK_SAME_ORIGIN_API_BASE}/checkout/status?${qs}`)
        const data = (await res.json()) as CheckoutStatus
        if (!active) return true

        if (!res.ok || data.error) {
          setStatus("error")
          setCheckout(data)
          setPollingAssets(false)
          return true
        }

        setCheckout(data)
        const paid = data.status === "paid" || data.status === "confirmed"
        if (paid) {
          setStatus("paid")
          const invoiceDone =
            data.invoiceReady ||
            data.invoiceStatus === "failed" ||
            data.invoiceStatus === "none"
          if (data.vouchersReady && invoiceDone) {
            setPollingAssets(false)
            return true
          }
          setPollingAssets(true)
          if (attempts >= 25) {
            setPollingAssets(false)
            return true
          }
          return false
        }

        if (attempts >= 30) {
          setStatus("error")
          setPollingAssets(false)
          return true
        }
        return false
      } catch {
        if (!active) return true
        if (attempts >= 30) {
          setStatus("error")
          setPollingAssets(false)
          return true
        }
        return false
      }
    }

    const id = setInterval(async () => {
      attempts += 1
      const done = await poll()
      if (done) clearInterval(id)
    }, 1500)

    void poll()

    return () => {
      active = false
      clearInterval(id)
    }
  }, [bookingId, sessionId, cancelled])

  const downloadLinks = useMemo(() => {
    if (!bookingId || !sessionId) return null
    const qs = checkoutQuery(bookingId, sessionId)
    return {
      invoice: `${TBOOK_SAME_ORIGIN_API_BASE}/checkout/invoice?${qs}`,
      vouchers: `${TBOOK_SAME_ORIGIN_API_BASE}/checkout/vouchers?${qs}`,
    }
  }, [bookingId, sessionId])

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p>{copy.loadingText}</p>
      </div>
    )
  }

  if (status === "cancelled") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <XCircle className="mx-auto size-14 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">Fizetés megszakítva</h1>
        <p className="mt-3 text-muted-foreground">
          A fizetést megszakítottad. Ha mégis szeretnél foglalni, indítsd újra a folyamatot.
        </p>
        <Link
          href="/jegyek"
          className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Vissza az eseményekhez
        </Link>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-destructive">{checkout?.error ?? copy.errorBody}</p>
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
  const backHref = returnTo?.trim() || checkout?.returnBaseUrl?.trim() || "/jegyek"
  const backLabel = backHref.includes("/jegyek") ? "Vissza a jegyekhez" : copy.successCta

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">{copy.successTitle}</h1>
      {checkout?.eventName ? (
        <p className="mt-2 text-sm font-medium text-foreground">{checkout.eventName}</p>
      ) : null}
      <p className="mt-3 text-muted-foreground">{body}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        A visszaigazolást e-mailben is elküldjük{checkout?.invoiceReady ? ", a számlával együtt" : ""}.
      </p>

      {downloadLinks && (checkout?.vouchersReady || checkout?.invoiceReady) ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {checkout.vouchersReady ? (
            <a
              href={downloadLinks.vouchers}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/60"
            >
              <Download className="size-4" aria-hidden />
              Jegyek letöltése (PDF)
            </a>
          ) : null}
          {checkout.invoiceReady ? (
            <a
              href={downloadLinks.invoice}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/60"
            >
              <Download className="size-4" aria-hidden />
              Számla letöltése (PDF)
            </a>
          ) : null}
        </div>
      ) : pollingAssets ? (
        <p className="mt-4 inline-flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Jegyek és számla előkészítése…
        </p>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          {checkout?.invoiceStatus === "failed"
            ? "A számla kiállítása sikertelen — ügyfélszolgálatunk segít."
            : "Ha a letöltés nem jelenik meg, ellenőrizd az e-mail fiókod is."}
        </p>
      )}

      <Link
        href={backHref}
        className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {backLabel}
      </Link>
    </div>
  )
}
