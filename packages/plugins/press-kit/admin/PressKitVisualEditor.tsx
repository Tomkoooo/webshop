"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { TopBar } from "@wse/core/features/homepage-cms/components/editor/TopBar"
import { DevicePreview } from "@wse/core/features/homepage-cms/components/editor/DevicePreview"
import { SurfaceDocEditProvider } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { useUndoableJsonDocument } from "@wse/core/features/template-cms/hooks/use-undoable-json-document"
import { PressKitPageRender } from "../storefront/PressKitPageRender"
import { PressKitBlockInserter } from "./PressKitBlockInserter"
import { PressKitPdfSidebarPanel } from "./PressKitPdfSidebarPanel"
import { PressKitPdfPreviewStub } from "./PressKitPdfPreviewStub"
import { pressKitAdminApi, type PressKitSettingsDto } from "./press-api"
import {
  defaultPressKitPageContent,
  normalizePressKitPageContentBlocks,
  type PressKitPageContent,
} from "../lib/page-content"

export function PressKitVisualEditor() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [brandName, setBrandName] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [reviewOpen, setReviewOpen] = useState(false)
  const [initialContent, setInitialContent] = useState<PressKitPageContent | null>(null)
  const [pdfMediaFilename, setPdfMediaFilename] = useState("")
  const [pdfSettings, setPdfSettings] = useState<PressKitSettingsDto["pdfSettings"]>({
    allowDownload: false,
    watermarkTemplate: "{{outlet}} — {{email}}",
    disableTextSelection: true,
    showPageNav: true,
  })
  const [initialPdf, setInitialPdf] = useState<{
    pdfMediaFilename: string
    pdfSettings: PressKitSettingsDto["pdfSettings"]
  } | null>(null)
  const hydrationKey = initialContent ? JSON.stringify(initialContent).slice(0, 48) : "loading"
  const pdfDirty =
    initialPdf != null &&
    (pdfMediaFilename !== initialPdf.pdfMediaFilename ||
      JSON.stringify(pdfSettings) !== JSON.stringify(initialPdf.pdfSettings))

  const { draft, setPath, undo, redo, canUndo, canRedo, dirty, markSynced, resetTo } =
    useUndoableJsonDocument<PressKitPageContent>(
      initialContent ?? defaultPressKitPageContent(),
      hydrationKey
    )

  useEffect(() => {
    Promise.all([
      pressKitAdminApi.getSettings(),
      fetch("/api/admin/branding").then((r) => r.json()),
    ])
      .then(([settingsRes, branding]) => {
        const raw = settingsRes.settings.pageContent as PressKitPageContent | undefined
        const content = raw?.blocks?.length
          ? { blocks: normalizePressKitPageContentBlocks(raw.blocks as PressKitPageContent["blocks"]) }
          : defaultPressKitPageContent()
        setInitialContent(content)
        setIsPublished(settingsRes.settings.isPublished)
        setBrandName(branding?.brandName || "")
        const pdf = {
          pdfMediaFilename: settingsRes.settings.pdfMediaFilename || "",
          pdfSettings: settingsRes.settings.pdfSettings,
        }
        setPdfMediaFilename(pdf.pdfMediaFilename)
        setPdfSettings(pdf.pdfSettings)
        setInitialPdf(pdf)
      })
      .catch(() => toast.error("Betöltés sikertelen"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!reviewOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReviewOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [reviewOpen])

  function applyPdfPatch(patch: {
    pdfMediaFilename?: string
    pdfSettings?: Partial<PressKitSettingsDto["pdfSettings"]>
  }) {
    if (patch.pdfMediaFilename !== undefined) setPdfMediaFilename(patch.pdfMediaFilename)
    if (patch.pdfSettings) setPdfSettings((prev) => ({ ...prev, ...patch.pdfSettings }))
  }

  async function persist(publish = false) {
    await pressKitAdminApi.updateSettings({
      pageContent: draft,
      pdfMediaFilename,
      pdfSettings,
      isPublished: publish ? true : isPublished,
    })
    markSynced()
    setInitialPdf({ pdfMediaFilename, pdfSettings })
    if (publish) {
      setIsPublished(true)
      toast.success("Közzétéve")
    } else {
      toast.success("Piszkozat mentve")
    }
  }

  if (loading || !initialContent) {
    return <p className="text-neutral-400 py-20 text-center italic">Vizuális szerkesztő betöltése…</p>
  }

  const previewShell = (
    <div className="min-h-[70vh] bg-background text-foreground">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <span className="font-semibold tracking-tight">{brandName || "Márka"}</span>
          <span className="text-xs text-muted-foreground">Sajtóanyagok</span>
        </div>
      </header>
      <PressKitPageRender
        content={draft}
        brandName={brandName}
        previewContact={{ name: "Szerkesztői előnézet", outlet: "Admin" }}
      />
      <PressKitPdfPreviewStub pdfMediaFilename={pdfMediaFilename} />
    </div>
  )

  return (
    <div className="cms-editor-chrome -mx-4 -mt-4 min-h-[calc(100vh-4rem)] text-foreground md:-mx-8">
      <TopBar
        dirty={dirty || pdfDirty}
        device={device}
        onDeviceChange={setDevice}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onSave={() => persist(false).catch(() => toast.error("Mentés sikertelen"))}
        onReview={() => setReviewOpen(true)}
        onOpenSettings={() => router.push("/admin/plugins/press-kit/content/settings")}
        onPublish={() => persist(true).catch(() => toast.error("Közzététel sikertelen"))}
        onDiscard={async () => {
          try {
            const res = await pressKitAdminApi.getSettings()
            resetTo(
              (res.settings.pageContent as PressKitPageContent | undefined) ??
                defaultPressKitPageContent()
            )
            const pdf = {
              pdfMediaFilename: res.settings.pdfMediaFilename || "",
              pdfSettings: res.settings.pdfSettings,
            }
            setPdfMediaFilename(pdf.pdfMediaFilename)
            setPdfSettings(pdf.pdfSettings)
            setInitialPdf(pdf)
            markSynced()
            toast.success("Változtatások elvetve")
          } catch {
            toast.error("Elvetés sikertelen")
          }
        }}
        onExit={() => router.push("/admin/plugins/press-kit")}
        toolbarEnd={
          <Link
            href="/sajto"
            target="_blank"
            className="px-3 h-9 border border-border text-xs font-medium inline-flex items-center rounded-md hover:bg-muted"
          >
            Éles portál
          </Link>
        }
      />

      <div className="px-4 py-3 border-b border-border bg-muted/40 text-sm text-muted-foreground">
        <p className="text-sm font-medium text-foreground mb-1">
          Sajtóportál — vizuális szerkesztő
        </p>
        <p>
          A szövegeket közvetlenül az előnézeten szerkesztheted. A PDF-et a bal oldali panelben
          állíthatod be; belépési mód és jelszó:{" "}
          <Link href="/admin/plugins/press-kit/content/settings" className="text-primary underline">
            Oldal beállítások
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PressKitBlockInserter
            blocks={draft.blocks}
            onInsert={(blocks) => setPath("blocks", blocks)}
          />
          <PressKitPdfSidebarPanel
            pdfMediaFilename={pdfMediaFilename}
            pdfSettings={pdfSettings}
            onChange={applyPdfPatch}
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            A képernyőképek teljes blokkolása nem lehetséges — használj vízjelet a PDF-nél.
          </p>
        </aside>

        <DevicePreview device={device}>
          <SurfaceDocEditProvider enabled setPath={setPath}>
            {previewShell}
          </SurfaceDocEditProvider>
        </DevicePreview>
      </div>

      {reviewOpen ? (
        <div className="fixed inset-0 z-[100] bg-background/95 overflow-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground">Előnézet</h2>
            <button
              type="button"
              onClick={() => setReviewOpen(false)}
              className="px-4 h-10 border border-border rounded-md text-sm font-medium hover:bg-muted"
            >
              Bezárás (Esc)
            </button>
          </div>
          <div className="max-w-5xl mx-auto rounded-xl shadow-sm overflow-hidden bg-background">
            {previewShell}
          </div>
        </div>
      ) : null}
    </div>
  )
}
