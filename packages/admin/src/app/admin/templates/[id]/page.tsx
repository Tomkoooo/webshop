import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { TemplateService } from "@wse/core/services/template"
import { readPreviewTemplateId } from "@wse/core/services/template-preview"
import { PageContentService } from "@wse/core/services/page-content"
import { Badge } from "@wse/core/components/ui/badge"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminPageScaffold, AdminSection } from "@wse/core/components/admin/AdminPageScaffold"
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
    <AdminPageScaffold
      backHref="/admin/templates"
      backLabel="Sablonok"
      title={template.manifest.name}
      description={template.manifest.description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {template.manifest.deployment === "commerce"
              ? "Teljes bolt"
              : "Landing / marketing"}
          </Badge>
          {isActive ? (
            <Badge className="border-none bg-emerald-600 text-white">Aktív</Badge>
          ) : null}
          {isPreviewTarget ? (
            <Badge className="border-none bg-amber-600 text-white">Előnézetben</Badge>
          ) : null}
        </div>
      }
    >
      <p className="text-xs text-muted-foreground">
        v{template.manifest.version} · {template.manifest.author}
      </p>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {template.manifest.screenshots[0] ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted/40 shadow-sm">
              <Image
                src={template.manifest.screenshots[0]}
                alt={template.manifest.name}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <AdminSection title="Sablon képességek">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <ul className="space-y-1 text-sm text-muted-foreground">
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
              </CardContent>
            </Card>
          </AdminSection>

          <AdminSection
            title="Oldalak és tartalom"
            description="A bejegyzések kulcsa megmarad a sablonváltáskor — visszaválthat a korábbi sablonra adatvesztés nélkül."
          >
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <ul className="divide-y text-sm">
                  {pages.map((p) => (
                    <li
                      key={p.key}
                      className="flex items-center justify-between py-2"
                    >
                      <span>{p.label}</span>
                      <span
                        className={
                          savedPageKeys.has(p.key)
                            ? "text-xs text-emerald-700"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {savedPageKeys.has(p.key) ? "egyedi tartalom" : "alapértelmezett"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </AdminSection>
        </div>

        <Card className="shadow-sm">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">
              {isActive
                ? "Ez a sablon aktív. Nyisd meg az előnézetet egy másik sablonnal a teszteléshez."
                : "Aktiváld a sablont vagy nyisd meg előnézetben (csak admin)."}
            </p>
            <TemplatePreviewControls
              templateId={template.manifest.id}
              isActive={isActive}
              isPreviewTarget={isPreviewTarget}
            />
          </CardContent>
        </Card>
      </div>
    </AdminPageScaffold>
  )
}
