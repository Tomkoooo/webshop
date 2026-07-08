import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { TemplateService } from "@wse/core/services/template"
import { readPreviewTemplateId } from "@wse/core/services/template-preview"
import { PageContentService } from "@wse/core/services/page-content"
import { Badge } from "@wse/core/components/ui/badge"
import { TemplatePreviewControls } from "../TemplatePreviewControls"

export const dynamic = "force-dynamic"

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const template = await TemplateService.getById(id)
  if (!template) notFound()

  const [activeInfo, savedPages, previewTemplateId] = await Promise.all([
    TemplateService.getActiveInfo(),
    PageContentService.listForTemplate(template.manifest.id),
    readPreviewTemplateId(),
  ])

  const isActive = template.manifest.id === activeInfo.templateId
  const isPreviewTarget = previewTemplateId === template.manifest.id
  const savedPageKeys = new Set(savedPages.map((p) => p.pageKey))

  const pages = [
    { key: "page:home", label: "Főoldal" },
    { key: "page:shop", label: "Bolt" },
    { key: "page:pdp", label: "Termékoldal" },
    ...Object.keys(template.staticPages).map((slug) => ({
      key: `page:${slug}`,
      label: `Statikus: /${slug}`,
    })),
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-baseline gap-4">
        <Link
          href="/admin/templates"
          className="text-xs uppercase tracking-widest text-neutral-500 hover:text-white"
        >
          ← Sablonok
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            {template.manifest.name}
          </h1>
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-white/25 text-neutral-300">
            {template.manifest.deployment === "commerce"
              ? "Teljes bolt"
              : "Landing / marketing"}
          </Badge>
          {isActive ? (
            <Badge className="bg-green-600 text-white border-none">Aktív</Badge>
          ) : null}
          {isPreviewTarget ? (
            <Badge className="bg-amber-600/95 text-white border-none">Előnézetben</Badge>
          ) : null}
        </div>
        <p className="text-sm text-neutral-400">{template.manifest.description}</p>
        <p className="text-xs text-neutral-500">
          v{template.manifest.version} · {template.manifest.author}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {template.manifest.screenshots[0] ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-white/10 bg-black/30">
              <Image
                src={template.manifest.screenshots[0]}
                alt={template.manifest.name}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-300">
              Sablon képességek
            </h2>
            <ul className="space-y-1 text-sm text-neutral-400">
              <li>
                Típus:{" "}
                {template.manifest.deployment === "commerce"
                  ? "commerce (marketing + bolt + termékoldal)"
                  : "landing csak (marketing; ne listáz shop/pdp-et a sablon manifests)"}
              </li>
              <li>
                Restyleli:{" "}
                {template.manifest.capabilities.restyles.join(", ") || "—"}
              </li>
              <li>
                Statikus oldalak:{" "}
                {template.manifest.capabilities.staticPages.length
                  ? template.manifest.capabilities.staticPages.join(", ")
                  : "nincs"}
              </li>
              <li>
                Blog modul:{" "}
                {template.manifest.capabilities.hasBlog ? "igen" : "nem"}
              </li>
            </ul>
          </section>

          <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-300">
              Oldalak és tartalom
            </h2>
            <p className="text-xs text-neutral-500">
              A bejegyzések kulcsa megmarad a sablonváltáskor — visszaválthat a
              korábbi sablonra adatvesztés nélkül.
            </p>
            <ul className="divide-y divide-white/10 text-sm">
              {pages.map((p) => (
                <li
                  key={p.key}
                  className="flex items-center justify-between py-2"
                >
                  <span>{p.label}</span>
                  <span
                    className={
                      savedPageKeys.has(p.key)
                        ? "text-xs text-green-400"
                        : "text-xs text-neutral-500"
                    }
                  >
                    {savedPageKeys.has(p.key) ? "egyedi tartalom" : "alapértelmezett"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4 rounded-md border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-neutral-400">
            {isActive
              ? "Ez a sablon aktív. Nyisd meg az előnézetet egy másik sablonnal a teszteléshez."
              : "Aktiváld a sablont vagy nyisd meg előnézetben (csak admin)."}
          </p>
          <TemplatePreviewControls
            templateId={template.manifest.id}
            isActive={isActive}
            isPreviewTarget={isPreviewTarget}
          />
        </aside>
      </div>
    </div>
  )
}
