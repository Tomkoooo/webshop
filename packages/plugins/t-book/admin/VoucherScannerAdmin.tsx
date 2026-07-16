"use client"
/* eslint-disable react-hooks/set-state-in-effect -- QR scanner lifecycle and camera init */

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { Button } from "@wse/core/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { adminSectionTitle } from "@wse/core/lib/admin-ui"
import {
  tBookAdminApi,
  VOUCHER_SCAN_RESULT_LABELS,
  VOUCHER_STATUS_LABELS,
  type AdminEvent,
  type VoucherScanResult,
} from "./t-book-api"
import {
  TBookField,
  TBookLoading,
  TBookPageHeader,
  TBookSelect,
  TBookStatusBadge,
} from "./t-book-admin-ui"

function ScanStatusBadge({ result }: { result: string }) {
  const labels = VOUCHER_SCAN_RESULT_LABELS
  const status =
    result === "valid"
      ? "active"
      : result === "duplicate" || result === "wrong_event"
        ? "pending"
        : result === "invalid"
          ? "cancelled"
          : result
  return <TBookStatusBadge status={status} labels={labels} />
}

type RecentScan = VoucherScanResult & { scannedAt: string; raw: string }

function decisionCopy(result: VoucherScanResult["result"]): {
  title: string
  verdict: string
  tone: "accept" | "reject" | "warn"
} {
  switch (result) {
    case "valid":
      return {
        title: "Beléptetés elfogadva",
        verdict: "A jegy érvényes — a vendég beléphet.",
        tone: "accept",
      }
    case "duplicate":
      return {
        title: "Már beléptetve — nem fogadható el újra",
        verdict: "Ez a jegy már egyszer be lett olvasva. Ne engedd be újra ezen a QR-kódon.",
        tone: "reject",
      }
    case "wrong_event":
      return {
        title: "Más esemény — nem fogadható el",
        verdict: "A jegy érvényes lehet, de nem ehhez az eseményhez tartozik.",
        tone: "warn",
      }
    case "invalid":
    default:
      return {
        title: "Érvénytelen jegy — nem fogadható el",
        verdict: "A QR-kód nem érvényes belépő (ismeretlen, törölt vagy hibás).",
        tone: "reject",
      }
  }
}

function ScanResultModal({
  open,
  scan,
  onClose,
}: {
  open: boolean
  scan: VoucherScanResult | null
  onClose: () => void
}) {
  if (!scan) return null
  const decision = decisionCopy(scan.result)
  const voucher = scan.voucher
  const Icon =
    decision.tone === "accept" ? CheckCircle2 : decision.tone === "warn" ? AlertTriangle : XCircle
  const iconClass =
    decision.tone === "accept"
      ? "text-emerald-600"
      : decision.tone === "warn"
        ? "text-amber-600"
        : "text-destructive"
  const panelClass =
    decision.tone === "accept"
      ? "bg-emerald-50 text-emerald-950"
      : decision.tone === "warn"
        ? "bg-amber-50 text-amber-950"
        : "bg-red-50 text-red-950"

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <Icon className={`size-16 ${iconClass}`} aria-hidden />
            <DialogTitle className="text-xl">{decision.title}</DialogTitle>
            <DialogDescription className="text-base text-foreground">
              {decision.verdict}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className={`rounded-lg p-4 space-y-2 text-sm ${panelClass}`}>
          <p className="font-semibold text-base">
            {VOUCHER_SCAN_RESULT_LABELS[scan.result] ?? scan.result}
          </p>
          {scan.message ? <p>{scan.message}</p> : null}
          {voucher ? (
            <div className="space-y-1 pt-2 border-t border-black/10">
              <p className="font-semibold text-base">{voucher.displayName}</p>
              <p>{voucher.eventSnapshot?.name}</p>
              {voucher.eventSnapshot?.locationAddress ? (
                <p>{voucher.eventSnapshot.locationAddress}</p>
              ) : null}
              <p>Foglalás: …{voucher.bookingId.slice(-8).toUpperCase()}</p>
              <p>Jegy státusz: {VOUCHER_STATUS_LABELS[voucher.status] ?? voucher.status}</p>
              {voucher.checkedInAt ? (
                <p className="font-medium">
                  Beléptetve: {new Date(voucher.checkedInAt).toLocaleString("hu-HU")}
                </p>
              ) : null}
            </div>
          ) : scan.result === "invalid" ? (
            <p>
              <Link href="/admin/plugins/t-book/bookings" className="underline font-medium">
                Keresés a foglalások között
              </Link>
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" className="w-full" size="lg" onClick={onClose} autoFocus>
            Rendben — következő szkennelés
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function VoucherScannerAdmin() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanControlsRef = useRef<{ stop: () => void } | null>(null)
  const lastScanRef = useRef<string>("")
  const cooldownRef = useRef<number>(0)
  const modalOpenRef = useRef(false)
  const scanningBusyRef = useRef(false)

  const [events, setEvents] = useState<AdminEvent[]>([])
  const [eventId, setEventId] = useState("")
  const [loading, setLoading] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalResult, setModalResult] = useState<VoucherScanResult | null>(null)
  const [lastResult, setLastResult] = useState<VoucherScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])
  const [stats, setStats] = useState<{ total: number; checkedIn: number; active: number } | null>(
    null
  )

  const loadEvents = useCallback(() => {
    tBookAdminApi<{ events: AdminEvent[] }>("events")
      .then((d) => setEvents(d.events.filter((e) => e.status === "active")))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    if (!eventId) return
    tBookAdminApi<{ stats: { total: number; checkedIn: number; active: number } }>(
      `vouchers/stats?eventId=${encodeURIComponent(eventId)}`
    )
      .then((d) => setStats(d.stats))
      .catch(() => setStats(null))
  }, [eventId, lastResult])

  const closeModal = useCallback(() => {
    modalOpenRef.current = false
    setModalOpen(false)
    lastScanRef.current = ""
    cooldownRef.current = Date.now()
  }, [])

  const handleScan = useCallback(
    async (raw: string) => {
      if (modalOpenRef.current || scanningBusyRef.current) return
      const now = Date.now()
      if (raw === lastScanRef.current && now - cooldownRef.current < 4000) return
      lastScanRef.current = raw
      cooldownRef.current = now
      scanningBusyRef.current = true

      try {
        const result = await tBookAdminApi<VoucherScanResult>("vouchers/scan", {
          method: "POST",
          body: JSON.stringify({
            token: raw,
            eventId: eventId || undefined,
            mode: "check_in",
          }),
        })
        setLastResult(result)
        setModalResult(result)
        modalOpenRef.current = true
        setModalOpen(true)
        setRecentScans((prev) =>
          [{ ...result, scannedAt: new Date().toISOString(), raw }, ...prev].slice(0, 10)
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Szkennelés sikertelen")
      } finally {
        scanningBusyRef.current = false
      }
    },
    [eventId]
  )

  useEffect(() => {
    if (!videoRef.current || loading) return

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    setCameraError(null)
    setScanning(true)

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) void handleScan(result.getText())
      })
      .then((controls) => {
        scanControlsRef.current = controls
        setCameraReady(true)
      })
      .catch((err) => {
        setCameraError(err instanceof Error ? err.message : "Kamera nem elérhető")
        setScanning(false)
      })

    return () => {
      scanControlsRef.current?.stop()
      scanControlsRef.current = null
      readerRef.current = null
      setCameraReady(false)
      setScanning(false)
    }
  }, [handleScan, loading])

  if (loading) return <TBookLoading label="Események betöltése…" />

  const displayStats = eventId ? stats : null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TBookPageHeader
        title="Beléptetés"
        description="Olvasd be a belépőjegy QR-kódját. Minden szkennelés után egyértelmű ablak mutatja, hogy elfogadható-e a jegy."
      />

      <ScanResultModal open={modalOpen} scan={modalResult} onClose={closeModal} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <TBookField label="Esemény szűrő (opcionális)">
                <TBookSelect value={eventId} onChange={(e) => setEventId(e.target.value)}>
                  <option value="">Minden esemény</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </TBookSelect>
              </TBookField>

              {displayStats ? (
                <p className="text-sm text-muted-foreground">
                  Beléptetve: {displayStats.checkedIn} / {displayStats.total}
                </p>
              ) : null}

              <div className="relative aspect-[4/3] rounded-lg bg-muted overflow-hidden">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  aria-label="QR szkenner kamera"
                />
                {!cameraReady && !cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/80 text-sm text-muted-foreground">
                    Kamera indítása…
                  </div>
                ) : null}
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/90 p-4 text-center text-sm text-muted-foreground">
                    <p>{cameraError}</p>
                    <p>Engedélyezd a kamera hozzáférést, majd frissítsd az oldalt.</p>
                  </div>
                ) : null}
                {scanning && cameraReady ? (
                  <div
                    className="pointer-events-none absolute inset-8 border-2 border-primary/60 rounded-lg"
                    aria-hidden
                  />
                ) : null}
                {modalOpen ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
                    Eredmény megerősítése…
                  </div>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground">
                A szkennelés szünetel, amíg az eredményablak nyitva van — így nem lehet véletlenül
                többször beléptetni ugyanazt a jegyet.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {lastResult ? (
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className={adminSectionTitle}>Utolsó eredmény</p>
                  <ScanStatusBadge result={lastResult.result} />
                </div>
                <p className="text-sm font-medium">{decisionCopy(lastResult.result).verdict}</p>
                {lastResult.voucher ? (
                  <p className="text-sm text-muted-foreground">
                    {lastResult.voucher.displayName}
                    {lastResult.voucher.checkedInAt
                      ? ` · ${new Date(lastResult.voucher.checkedInAt).toLocaleString("hu-HU")}`
                      : ""}
                  </p>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  setModalResult(lastResult)
                  modalOpenRef.current = true
                  setModalOpen(true)
                }}>
                  Eredmény újra
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Várakozás QR-kódra…
              </CardContent>
            </Card>
          )}

          {recentScans.length > 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <p className={adminSectionTitle}>Legutóbbi szkennelések</p>
                <ul className="space-y-2">
                  {recentScans.map((scan, index) => (
                    <li
                      key={`${scan.raw}-${scan.scannedAt}-${index}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <button
                        type="button"
                        className="truncate text-left text-foreground hover:underline"
                        onClick={() => {
                          setModalResult(scan)
                          modalOpenRef.current = true
                          setModalOpen(true)
                        }}
                      >
                        {scan.voucher?.displayName ?? scan.raw.slice(0, 12)}
                      </button>
                      <ScanStatusBadge result={scan.result} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
