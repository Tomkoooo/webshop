"use client"

import { useCallback, useEffect, useState } from "react"
import { PressGate } from "./PressGate"
import { PressPdfViewer } from "./PressPdfViewer"
import { PressKitPageRender } from "./PressKitPageRender"
import { pressPortalApi, type PressContentResponse } from "./press-api-client"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { trackPressEvent } from "@wse/core/lib/analytics/track"
import { getPluginStorefrontSurface } from "@wse/core/lib/plugin-storefront-ui"
import {
  normalizePressKitPageContent,
  normalizePressKitPageContentBlocks,
  type PressKitPageContent,
} from "../lib/page-content"
import type { IPressKitSettings } from "../models/PressKitSettings"

type Props = {
  tokenFromUrl?: string
  portalTitle: string
  templateId: string
  brandName: string
}

function resolvePageContent(data: PressContentResponse): PressKitPageContent {
  if (data.content.pageContent?.blocks?.length) {
    return {
      blocks: normalizePressKitPageContentBlocks(
        data.content.pageContent.blocks as PressKitPageContent["blocks"]
      ),
    }
  }
  return normalizePressKitPageContent({
    pageTitle: data.content.pageTitle,
    heroImage: data.content.heroImage,
    embargoNote: data.content.embargoNote,
    sections: data.content.sections,
    productHighlights: data.content.productHighlights,
  } as Pick<
    IPressKitSettings,
    "pageTitle" | "heroImage" | "embargoNote" | "sections" | "productHighlights"
  >)
}

export function PressPortalClient({
  tokenFromUrl,
  portalTitle,
  templateId,
  brandName,
}: Props) {
  const surface = getPluginStorefrontSurface(templateId)
  const [accessMode, setAccessMode] = useState<string>("unique_link")
  const [authenticated, setAuthenticated] = useState(false)
  const [content, setContent] = useState<PressContentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    const [config, session] = await Promise.all([
      pressPortalApi.getPortalConfig(),
      pressPortalApi.getSession(),
    ])
    if (config.ok) setAccessMode(config.accessMode)

    if (!session.ok && config.accessMode === "unique_link" && tokenFromUrl) {
      try {
        await pressPortalApi.auth({ token: tokenFromUrl })
        const retry = await pressPortalApi.getSession()
        if (retry.ok && retry.contact) {
          setAuthenticated(true)
          const data = await pressPortalApi.getContent()
          setContent(data)
          setLoading(false)
          return
        }
      } catch {
        // show gate
      }
    }

    if (session.ok && session.contact) {
      setAuthenticated(true)
      try {
        const data = await pressPortalApi.getContent()
        setContent(data)
        trackPressEvent("press_page_view", {
          press_contact_id: data.contact.id,
          press_outlet: data.contact.outlet,
          press_name: data.contact.name,
          page_section: "portal",
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : "Tartalom nem elérhető")
        setAuthenticated(false)
      }
    }
    setLoading(false)
  }, [tokenFromUrl])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  async function handleLogout() {
    await pressPortalApi.logout()
    setAuthenticated(false)
    setContent(null)
  }

  if (loading) {
    return (
      <div className={`${surface.contentShell} flex min-h-[50vh] items-center justify-center py-20`}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className={`${surface.contentShell} flex min-h-[50vh] items-center justify-center py-12`}>
        <PressGate
          accessMode={accessMode}
          tokenFromUrl={tokenFromUrl}
          portalTitle={portalTitle}
          templateId={templateId}
          onSuccess={() => {
            setLoading(true)
            loadSession()
          }}
        />
      </div>
    )
  }

  if (error || !content) {
    return (
      <p className={`${surface.contentShell} py-20 text-center text-destructive`}>
        {error || "Nincs tartalom"}
      </p>
    )
  }

  const { contact, watermark } = content
  const pageContent = resolvePageContent(content)
  const page = content.content

  return (
    <div className={`${surface.contentShell} space-y-10 pb-10`}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <p className={surface.eyebrow}>{portalTitle}</p>
          <p className="text-sm text-muted-foreground">
            {contact.name} · {contact.outlet}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
          Kilépés
        </Button>
      </header>

      <PressKitPageRender
        content={pageContent}
        brandName={brandName}
        portalTitle={portalTitle}
        templateId={templateId}
      />

      {page.pdfMediaFilename ? (
        <section className="space-y-4 border-t border-border pt-10">
          <h2 className={surface.sectionTitle}>Digitális előnézet</h2>
          <PressPdfViewer
            allowDownload={page.pdfSettings.allowDownload}
            disableTextSelection={page.pdfSettings.disableTextSelection}
            showPageNav={page.pdfSettings.showPageNav}
            watermark={watermark}
            contact={contact}
          />
        </section>
      ) : null}
    </div>
  )
}
