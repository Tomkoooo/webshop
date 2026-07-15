"use client"
/* eslint-disable react-hooks/set-state-in-effect -- QR scanner lifecycle and camera init */

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { toast } from "sonner"
import { Card, CardContent } from "@wse/core/components/ui/card"
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

function ScanResultCard({ scan }: { scan: VoucherScanResult }) {
  const voucher = scan.voucher
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className={adminSectionTitle}>
            {VOUCHER_SCAN_RESULT_LABELS[scan.result] ?? scan.result}
          </p>
          <ScanStatusBadge result={scan.result} />
        </div>
        {scan.message ? <p className="text-sm text-muted-foreground">{scan.message}</p> : null}
        {voucher ? (
          <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-sm">
            <p className="font-semibold text-foreground text-base">{voucher.displayName}</p>
            <p className="text-muted-foreground">{voucher.eventSnapshot?.name}</p>
            {voucher.eventSnapshot?.locationAddress ? (
              <p className="text-muted-foreground">{voucher.eventSnapshot.locationAddress}</p>
            ) : null}
            <p className="text-muted-foreground">
              Foglalás: …{voucher.bookingId.slice(-8).toUpperCase()}
            </p>
            <p className="text-muted-foreground">
              Jegy státusz: {VOUCHER_STATUS_LABELS[voucher.status] ?? voucher.status}
            </p>
            {voucher.checkedInAt ? (
              <p className="text-muted-foreground">
                Beléptetve: {new Date(voucher.checkedInAt).toLocaleString("hu-HU")}
              </p>
            ) : null}
          </div>
        ) : scan.result === "invalid" ? (
          <p className="text-sm">
            <Link href="/admin/plugins/t-book/bookings" className="text-primary underline">
              Keresés a foglalások között
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function VoucherScannerAdmin() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanControlsRef = useRef<{ stop: () => void } | null>(null)
  const lastScanRef = useRef<string>("")
  const cooldownRef = useRef<number>(0)

  const [events, setEvents] = useState<AdminEvent[]>([])
  const [eventId, setEventId] = useState("")
  const [loading, setLoading] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
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

  const displayStats = eventId ? stats : null

  const handleScan = useCallback(
    async (raw: string) => {
      const now = Date.now()
      if (raw === lastScanRef.current && now - cooldownRef.current < 3000) return
      lastScanRef.current = raw
      cooldownRef.current = now

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
        setRecentScans((prev) =>
          [{ ...result, scannedAt: new Date().toISOString(), raw }, ...prev].slice(0, 10)
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Szkennelés sikertelen")
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TBookPageHeader
        title="Beléptetés"
        description="Olvasd be a belépőjegy QR-kódját a kamerával. Az első szkennelés belépteti a vendéget."
      />

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
              </div>

              <p className="text-xs text-muted-foreground">
                Tartsd a QR-kódot a keret közepéhez. Ugyanaz a kód 3 másodpercig nem olvasható újra.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {lastResult ? <ScanResultCard scan={lastResult} /> : (
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
                      <span className="truncate text-foreground">
                        {scan.voucher?.displayName ?? scan.raw.slice(0, 12)}
                      </span>
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
