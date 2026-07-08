"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import * as pdfjs from "pdfjs-dist"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { pressPortalApi } from "./press-api-client"
import { trackPressEvent } from "@wse/core/lib/analytics/track"
import type { PressContactSession } from "./press-api-client"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

type Props = {
  allowDownload: boolean
  disableTextSelection: boolean
  showPageNav: boolean
  watermark: string
  contact: PressContactSession
}

export function PressPdfViewer({
  allowDownload,
  disableTextSelection,
  showPageNav,
  watermark,
  contact,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pdfRef = useRef<pdfjs.PDFDocumentProxy | null>(null)
  const lastLoggedPage = useRef(0)

  const renderPage = useCallback(
    async (doc: pdfjs.PDFDocumentProxy, pageNum: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const pdfPage = await doc.getPage(pageNum)
      const viewport = pdfPage.getViewport({ scale: 1.5 })
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      canvas.height = viewport.height
      canvas.width = viewport.width
      await pdfPage.render({ canvasContext: ctx, viewport }).promise
    },
    []
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(pressPortalApi.pdfFileUrl(), { credentials: "include" })
        if (!res.ok) throw new Error("PDF nem tölthető be")
        const buf = await res.arrayBuffer()
        const doc = await pdfjs.getDocument({ data: buf }).promise
        if (cancelled) return
        pdfRef.current = doc
        setNumPages(doc.numPages)
        await renderPage(doc, 1)
        trackPressEvent("press_pdf_view", {
          press_contact_id: contact.id,
          press_outlet: contact.outlet,
          press_name: contact.name,
          pdf_page: 1,
        })
        await pressPortalApi.logEvent("pdf_open")
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "PDF hiba")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      pdfRef.current?.destroy()
    }
  }, [contact.id, contact.name, contact.outlet, renderPage])

  useEffect(() => {
    const doc = pdfRef.current
    if (!doc || page < 1) return
    renderPage(doc, page).then(() => {
      if (lastLoggedPage.current !== page) {
        lastLoggedPage.current = page
        trackPressEvent("press_pdf_view", {
          press_contact_id: contact.id,
          press_outlet: contact.outlet,
          press_name: contact.name,
          pdf_page: page,
        })
        void pressPortalApi.logEvent("pdf_page_view", { page })
      }
    })
  }, [page, contact, renderPage])

  async function handleDownload() {
    if (!allowDownload) return
    const res = await fetch(pressPortalApi.pdfFileUrl(), { credentials: "include" })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "press-preview.pdf"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card className="border-border py-12">
        <CardContent className="flex justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }
  if (error) return <p className="text-destructive text-sm">{error}</p>

  return (
    <Card
      className={`relative gap-0 overflow-hidden border-border bg-muted/30 py-0 ${
        disableTextSelection ? "select-none press-no-print" : ""
      }`}
      onContextMenu={(e) => {
        if (!allowDownload) e.preventDefault()
      }}
    >
      <div className="relative inline-block w-full">
        <canvas ref={canvasRef} className="mx-auto max-w-full h-auto block" />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20 text-sm font-semibold rotate-[-24deg] text-foreground"
          aria-hidden
        >
          {watermark}
        </div>
      </div>
      {showPageNav && numPages > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Előző
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {numPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= numPages}
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          >
            Következő
          </Button>
        </div>
      ) : null}
      {allowDownload ? (
        <div className="border-t border-border p-3">
          <Button type="button" variant="secondary" size="sm" onClick={handleDownload}>
            PDF letöltése
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
