"use client"

import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { EditableDocRichText } from "@wse/core/features/template-cms/primitives/EditableDocRichText"
import { PressKitInlineRichEditor } from "../admin/PressKitInlineRichEditor"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { Button } from "@wse/core/components/ui/button"
import { getPluginStorefrontSurface } from "@wse/core/lib/plugin-storefront-ui"
import { cn } from "@wse/core/lib/utils"
import type { PressKitPageBlock, PressKitPageContent } from "../lib/page-content"

type Props = {
  content: PressKitPageContent
  brandName?: string
  portalTitle?: string
  templateId?: string
  previewContact?: { name: string; outlet: string }
}

export function PressKitPageRender({
  content,
  brandName = "",
  portalTitle = "Sajtóanyagok",
  templateId = "default-modern",
  previewContact,
}: Props) {
  const cms = useSurfaceDocEdit()
  const surface = getPluginStorefrontSurface(templateId)

  return (
    <article className={cn(surface.sectionSpacing, "text-foreground")}>
      {cms.enabled ? (
        <div className={surface.cmsBanner}>
          <p className="mb-1 w-full text-[10px] uppercase tracking-widest text-muted-foreground">
            Blokkok — kattints az előnézeten a szövegek szerkesztéséhez
          </p>
        </div>
      ) : null}

      {previewContact ? (
        <p className="text-sm text-muted-foreground">
          {previewContact.name} · {previewContact.outlet}
        </p>
      ) : null}

      {content.blocks.map((block, index) => (
        <PressKitBlockView
          key={block.id}
          block={block}
          index={index}
          blocks={content.blocks}
          brandName={brandName}
          portalTitle={portalTitle}
          templateId={templateId}
        />
      ))}
    </article>
  )
}

function PressKitBlockView({
  block,
  index,
  blocks,
  brandName,
  portalTitle,
  templateId,
}: {
  block: PressKitPageBlock
  index: number
  blocks: PressKitPageBlock[]
  brandName: string
  portalTitle: string
  templateId: string
}) {
  const cms = useSurfaceDocEdit()
  const surface = getPluginStorefrontSurface(templateId)
  const base = `blocks.${index}`

  const removeBlock = () => {
    cms.setPath(
      "blocks",
      blocks.filter((_, i) => i !== index)
    )
  }

  const moveBlock = (dir: -1 | 1) => {
    const next = [...blocks]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    const tmp = next[index]!
    next[index] = next[target]!
    next[target] = tmp
    cms.setPath("blocks", next)
  }

  const blockChrome = cms.enabled ? (
    <div className={surface.cmsBlockChrome}>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {block.type}
      </span>
      <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => moveBlock(-1)}>
        ↑
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => moveBlock(1)}>
        ↓
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-[10px] text-destructive"
        onClick={removeBlock}
      >
        Törlés
      </Button>
    </div>
  ) : null

  if (block.type === "hero") {
    return (
      <section className="border-b border-border pb-12">
        {blockChrome}
        <header className="space-y-4">
          <p className={surface.eyebrow}>
            <EditableDocText path={`${base}.eyebrow`} value={block.eyebrow} placeholder="Sajtóanyag" />
          </p>
          <h1 className={surface.heroTitle}>
            <EditableDocText path={`${base}.pageTitle`} value={block.pageTitle} placeholder={portalTitle} />
          </h1>
          {brandName && !cms.enabled ? (
            <p className="text-sm text-muted-foreground">{brandName}</p>
          ) : null}
        </header>
        {block.heroImage || cms.enabled ? (
          <div className="relative mt-8 aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted">
            {block.heroImage ? (
              <FallbackImage
                src={mediaImageSrc(block.heroImage)}
                alt=""
                fill
                className="object-cover"
              />
            ) : null}
            {cms.enabled ? (
              <div className="absolute bottom-2 left-2 right-2 rounded bg-black/50 p-2 text-xs text-white">
                <span className="block text-[10px] uppercase tracking-widest opacity-80">Hero kép URL</span>
                <EditableDocText path={`${base}.heroImage`} value={block.heroImage} placeholder="/api/media/…" />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    )
  }

  if (block.type === "embargo") {
    if (!block.text && !cms.enabled) return null
    return (
      <section>
        {blockChrome}
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <EditableDocText path={`${base}.text`} value={block.text} multiline placeholder="Embargó / figyelmeztetés" />
        </div>
      </section>
    )
  }

  if (block.type === "richText") {
    return (
      <section className="space-y-3 border-b border-border pb-12">
        {blockChrome}
        {(block.title || cms.enabled) && (
          <h2 className={surface.sectionTitle}>
            <EditableDocText path={`${base}.title`} value={block.title} placeholder="Szakasz címe" />
          </h2>
        )}
        <EditableDocRichText
          path={`${base}.bodyHtml`}
          html={block.bodyHtml}
          className={surface.prose}
        />
      </section>
    )
  }

  if (block.type === "plainText") {
    const html = block.bodyHtml || (block.body ? `<p>${block.body}</p>` : "")
    if (!html.replace(/<[^>]+>/g, "").trim() && !cms.enabled) return null
    return (
      <section className="space-y-3 border-b border-border pb-12">
        {blockChrome}
        <PressKitInlineRichEditor
          path={`${base}.bodyHtml`}
          html={html}
          className={cn(surface.prose, "text-base leading-relaxed")}
        />
      </section>
    )
  }

  if (block.type === "highlights") {
    if (block.items.length === 0 && !cms.enabled) return null
    return (
      <section className="border-b border-border pb-12">
        {blockChrome}
        <div className="grid gap-4 sm:grid-cols-2">
          {block.items.map((item, itemIdx) => (
            <div key={itemIdx} className={surface.highlightCard}>
              <p className={surface.eyebrow}>
                <EditableDocText
                  path={`${base}.items.${itemIdx}.label`}
                  value={item.label}
                  placeholder="Címke"
                />
              </p>
              <p className="font-medium text-foreground">
                <EditableDocText
                  path={`${base}.items.${itemIdx}.detail`}
                  value={item.detail}
                  multiline
                  placeholder="Részlet"
                />
              </p>
            </div>
          ))}
        </div>
        {cms.enabled ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() =>
              cms.setPath(`${base}.items`, [...block.items, { label: "", detail: "" }])
            }
          >
            Kiemelés hozzáadása
          </Button>
        ) : null}
      </section>
    )
  }

  return null
}
