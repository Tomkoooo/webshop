import Link from "next/link"
import Image from "next/image"
import { TemplateService } from "@wse/core/services/template"
import { readPreviewTemplateId } from "@wse/core/services/template-preview"
import { Badge } from "@wse/core/components/ui/badge"
import { TemplatePreviewControls } from "./TemplatePreviewControls"

export const dynamic = "force-dynamic"

export default async function AdminTemplatesPage() {
  const [templates, activeInfo, previewTemplateId] = await Promise.all([
    TemplateService.listForDeployment(),
    TemplateService.getActiveInfo(),
    readPreviewTemplateId(),
  ])

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tight">Sablonok</h1>
        <p className="text-sm text-neutral-400">
          Az aktív sablon határozza meg a publikus oldalak megjelenését (főoldal, bolt,
          termékoldal, statikus oldalak). A sablon váltása nem törli a korábbi sablon
          tartalmát — bármikor visszaválthat.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {templates.map((template) => {
          const isActive = template.manifest.id === activeInfo.templateId
          const isPreviewTarget = previewTemplateId === template.manifest.id
          return (
            <article
              key={template.manifest.id}
              className="overflow-hidden rounded-md border border-white/10 bg-white/5"
            >
              <div className="relative aspect-[16/10] w-full bg-black/30">
                {template.manifest.screenshots[0] ? (
                  <Image
                    src={template.manifest.screenshots[0]}
                    alt={template.manifest.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                    No preview
                  </div>
                )}
                {isActive ? (
                  <Badge className="absolute right-3 top-3 bg-green-600 text-white border-none">
                    Aktív
                  </Badge>
                ) : null}
                {isPreviewTarget ? (
                  <Badge className="absolute left-3 top-3 bg-amber-600/95 text-white border-none">
                    Előnézet
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black uppercase tracking-tight">
                        {template.manifest.name}
                      </h2>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-white/25 text-neutral-300">
                        {template.manifest.deployment === "commerce"
                          ? "Teljes bolt"
                          : "Landing / marketing"}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500">
                      v{template.manifest.version} &middot; {template.manifest.author}
                    </p>
                  </div>
                  <Link
                    href={`/admin/templates/${template.manifest.id}`}
                    className="text-xs font-semibold uppercase tracking-widest text-neutral-300 hover:text-white"
                  >
                    Részletek
                  </Link>
                </div>
                <p className="text-sm text-neutral-400">{template.manifest.description}</p>

                <TemplatePreviewControls
                  templateId={template.manifest.id}
                  isActive={isActive}
                  isPreviewTarget={isPreviewTarget}
                />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
