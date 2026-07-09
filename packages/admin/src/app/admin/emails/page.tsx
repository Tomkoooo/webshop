import { EmailTemplateService } from "@wse/core/services/email-template"
import { EMAIL_TEMPLATE_TYPE_LABELS } from "@wse/core/lib/email-template-catalog"
import { getEmailTemplateCardAccent } from "@wse/core/lib/email-template-ui"
import { EmailTemplateTagBadges } from "@wse/core/components/admin/EmailTemplateTagBadges"
import { EmailTemplateRelationBanner } from "@wse/core/components/admin/EmailTemplateRelationBanner"
import { Mail, Edit2, Info, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { initializeMissingEmailTemplates, seedEmailTemplates } from "@wse/core/actions/admin-emails"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"

function templateTitle(type: string) {
  return EMAIL_TEMPLATE_TYPE_LABELS[type] ?? type.replace(/_/g, " ")
}

export default async function AdminEmails() {
  const templates = await EmailTemplateService.getAll()

  const sorted = [...templates].sort((a, b) => {
    const invoiceOrder = ["invoice_sent", "invoice_issue"]
    const ai = invoiceOrder.indexOf(a.type)
    const bi = invoiceOrder.indexOf(b.type)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.type.localeCompare(b.type)
  })

  return (
    <AdminPageScaffold
      title="Email sablonok"
      description={
        <>
          Színes címkék: plugin / folyamat szerint. A{" "}
          <span className="text-amber-800">Számlázz.hu</span> számla és számlázási probléma sablonok
          párban futnak — siker → <code className="text-amber-900/80">invoice_sent</code>, hiba →{" "}
          <code className="text-rose-800/80">invoice_issue</code>.
        </>
      }
      actions={
        <div className="flex flex-wrap gap-3">
          <form action={initializeMissingEmailTemplates}>
            <Button type="submit">
              <RefreshCw className="size-4" />
              Hiányzó sablonok inicializálása
            </Button>
          </form>
          {templates.length > 0 ? (
            <form action={seedEmailTemplates}>
              <Button variant="ghost" type="submit">
                <RefreshCw className="size-4" />
                Sablonok visszaállítása
              </Button>
            </form>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Jelmagyarázat:</span>
        <EmailTemplateTagBadges
          tags={["shop", "contact", "szamlazz", "szamlazz-failure", "camp-booking"]}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {sorted.length === 0 ? (
          <Card className="col-span-full shadow-sm">
            <CardContent className="space-y-4 py-12 text-center">
              <Mail className="mx-auto size-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Még nincsenek sablonok az adatbázisban. Kattintson az inicializálásra!
              </p>
            </CardContent>
          </Card>
        ) : (
          sorted.map((template) => (
            <Card
              key={template.type}
              className={`shadow-sm ${getEmailTemplateCardAccent(template.tags, template.type)}`}
            >
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="admin-icon-well flex size-12 items-center justify-center">
                      <Mail className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold leading-none">
                        {templateTitle(template.type)}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.type}
                        {template.pluginId ? (
                          <span> · plugin: {template.pluginId}</span>
                        ) : (
                          <span> · core</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Link href={`/admin/emails/${template.type}`}>
                    <Button variant="ghost" size="icon">
                      <Edit2 className="size-4" />
                    </Button>
                  </Link>
                </div>

                <EmailTemplateRelationBanner templateType={template.type} />

                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {template.description || "Nincs leírás megadva."}
                  </p>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Címkék</p>
                    <EmailTemplateTagBadges tags={template.tags ?? []} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Változók</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable: string) => (
                        <span
                          key={variable}
                          className="rounded-sm bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground"
                        >
                          {"{{"}
                          {variable}
                          {"}}"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Info className="size-3.5" />
                    Jelenlegi tárgy
                  </p>
                  <p className="truncate text-sm font-medium">{template.subject}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageScaffold>
  )
}
