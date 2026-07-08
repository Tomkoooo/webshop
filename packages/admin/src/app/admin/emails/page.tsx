import { EmailTemplateService } from "@wse/core/services/email-template"
import { EMAIL_TEMPLATE_TYPE_LABELS } from "@wse/core/lib/email-template-catalog"
import { getEmailTemplateCardAccent } from "@wse/core/lib/email-template-ui"
import { EmailTemplateTagBadges } from "@wse/core/components/admin/EmailTemplateTagBadges"
import { EmailTemplateRelationBanner } from "@wse/core/components/admin/EmailTemplateRelationBanner"
import { Mail, Edit2, Info, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { initializeMissingEmailTemplates, seedEmailTemplates } from "@wse/core/actions/admin-emails"

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
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
            Email <span className="admin-headline-accent">Sablonok</span>
          </h1>
          <p className="text-white/40 font-medium italic max-w-2xl">
            Színes címkék: plugin / folyamat szerint. A{" "}
            <span className="text-amber-300">Számlázz.hu</span> számla és számlázási probléma sablonok
            párban futnak — siker → <code className="text-amber-200/80">invoice_sent</code>, hiba →{" "}
            <code className="text-rose-200/80">invoice_issue</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <form action={initializeMissingEmailTemplates}>
            <Button variant="krausz" type="submit" className="h-14 px-8 flex items-center gap-3">
              <RefreshCw className="w-5 h-5" />
              HIÁNYZÓ SABLONOK INICIALIZÁLÁSA
            </Button>
          </form>
          {templates.length > 0 ? (
            <form action={seedEmailTemplates}>
              <Button
                variant="ghost"
                type="submit"
                className="text-neutral-500 hover:text-white hover:bg-white/5 uppercase tracking-widest text-[10px] font-black gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                SABLONOK VISSZAÁLLÍTÁSA
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">
        <span className="text-neutral-400">Jelmagyarázat:</span>
        <EmailTemplateTagBadges
          tags={["shop", "contact", "szamlazz", "szamlazz-failure", "camp-booking"]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sorted.length === 0 ? (
          <div className="col-span-full bg-white/5 border border-white/10 p-12 text-center space-y-4">
            <Mail className="w-12 h-12 text-neutral-700 mx-auto" />
            <p className="text-white/20 italic font-medium">
              Még nincsenek sablonok az adatbázisban. Kattintson az inicializálásra!
            </p>
          </div>
        ) : (
          sorted.map((template) => (
            <div
              key={template.type}
              className={`group bg-white/5 border border-white/10 p-8 space-y-5 hover:border-white/25 transition-all duration-300 ${getEmailTemplateCardAccent(template.tags, template.type)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 admin-icon-well flex items-center justify-center transition-transform group-hover:scale-110">
                    <Mail className="w-6 h-6 admin-icon-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-xl text-white uppercase italic tracking-wider leading-none mb-1">
                      {templateTitle(template.type)}
                    </h3>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-none">
                      {template.type}
                      {template.pluginId ? (
                        <span className="text-lime-400/90"> · plugin: {template.pluginId}</span>
                      ) : (
                        <span className="text-slate-400"> · core</span>
                      )}
                    </p>
                  </div>
                </div>
                <Link href={`/admin/emails/${template.type}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-white/10 text-neutral-500 hover:text-white border border-transparent hover:border-white/10 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <EmailTemplateRelationBanner templateType={template.type} />

              <div className="space-y-3">
                <p className="text-sm text-neutral-400 font-medium leading-relaxed">
                  {template.description || "Nincs leírás megadva."}
                </p>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                    Címkék
                  </p>
                  <EmailTemplateTagBadges tags={template.tags ?? []} />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                    Változók
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable: string) => (
                      <span
                        key={variable}
                        className="px-2.5 py-1 bg-zinc-900/80 border border-zinc-700/80 text-[9px] font-mono text-zinc-400 rounded-sm"
                      >
                        {"{{"}
                        {variable}
                        {"}}"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  Jelenlegi tárgy
                </p>
                <p className="text-sm font-bold text-white truncate italic">{template.subject}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
