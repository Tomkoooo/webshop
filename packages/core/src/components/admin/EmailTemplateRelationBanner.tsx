import Link from "next/link"
import { Link2 } from "lucide-react"
import { EMAIL_TEMPLATE_TYPE_LABELS } from "@wse/core/lib/email-template-catalog"
import { getEmailTemplateRelation } from "@wse/core/lib/email-template-ui"

function relatedTitle(type: string) {
  return EMAIL_TEMPLATE_TYPE_LABELS[type] ?? type.replace(/_/g, " ")
}

export function EmailTemplateRelationBanner({ templateType }: { templateType: string }) {
  const relation = getEmailTemplateRelation(templateType)
  if (!relation) return null

  const isInvoicePair =
    templateType === "invoice_sent" || templateType === "invoice_issue"

  return (
    <div
      className={`rounded-sm border p-3 space-y-2 text-xs leading-relaxed ${
        isInvoicePair
          ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
          : "border-white/15 bg-white/5 text-neutral-300"
      }`}
    >
      <p className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0" />
        {isInvoicePair ? "Számlázz.hu pár" : "Kapcsolódó sablon"}
      </p>
      <p>{relation.note}</p>
      <ul className="flex flex-wrap gap-2">
        {relation.relatedTypes.map((related) => (
          <li key={related}>
            <Link
              href={`/admin/emails/${related}`}
              className={`inline-flex items-center gap-1 px-2 py-1 border text-[9px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 ${
                isInvoicePair
                  ? "border-amber-400/50 bg-amber-600/20 text-amber-50"
                  : "border-white/20 bg-black/40 text-white"
              }`}
            >
              → {relatedTitle(related)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
