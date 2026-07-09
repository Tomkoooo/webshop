import Link from "next/link"
import Image from "next/image"
import { TemplateService } from "@wse/core/services/template"
import { readPreviewTemplateId } from "@wse/core/services/template-preview"
import { Badge } from "@wse/core/components/ui/badge"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { TemplatePreviewControls } from "./TemplatePreviewControls"

export const dynamic = "force-dynamic"

export default async function AdminTemplatesPage() {
  const [templates, activeInfo, previewTemplateId] = await Promise.all([
    TemplateService.listForDeployment(),
    TemplateService.getActiveInfo(),
    readPreviewTemplateId(),
  ])

  return (
    <AdminPageScaffold
      title="Sablonok"
      description="Az aktív sablon határozza meg a publikus oldalak megjelenését (főoldal, bolt, termékoldal, statikus oldalak). A sablon váltása nem törli a korábbi sablon tartalmát — bármikor visszaválthat."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {templates.map((template) => {
          const isActive = template.manifest.id === activeInfo.templateId
          const isPreviewTarget = previewTemplateId === template.manifest.id
          return (
            <Card key={template.manifest.id} className="overflow-hidden py-0 shadow-sm">
              <div className="relative aspect-[16/10] w-full bg-muted/40">
                {template.manifest.screenshots[0] ? (
                  <Image
                    src={template.manifest.screenshots[0]}
                    alt={template.manifest.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Nincs előnézet
                  </div>
                )}
                {isActive ? (
                  <Badge className="absolute right-3 top-3 border-none bg-emerald-600 text-white">
                    Aktív
                  </Badge>
                ) : null}
                {isPreviewTarget ? (
                  <Badge className="absolute left-3 top-3 border-none bg-amber-600 text-white">
                    Előnézet
                  </Badge>
                ) : null}
              </div>

              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">
                        {template.manifest.name}
                      </h2>
                      <Badge variant="outline">
                        {template.manifest.deployment === "commerce"
                          ? "Teljes bolt"
                          : "Landing / marketing"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      v{template.manifest.version} · {template.manifest.author}
                    </p>
                  </div>
                  <Link
                    href={`/admin/templates/${template.manifest.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Részletek
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">{template.manifest.description}</p>

                <TemplatePreviewControls
                  templateId={template.manifest.id}
                  isActive={isActive}
                  isPreviewTarget={isPreviewTarget}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </AdminPageScaffold>
  )
}
