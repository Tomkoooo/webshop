import Link from "next/link"
import { Link2 } from "lucide-react"
import { EMAIL_TEMPLATE_TYPE_LABELS } from "@wse/core/lib/email-template-catalog"
import { adminAlertInfo, adminAlertWarning } from "@wse/core/lib/admin-ui"
import { getEmailTemplateRelation } from "@wse/core/lib/email-template-ui"
import { cn } from "@wse/core/lib/utils"

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
      className={cn(
        "space-y-2 rounded-lg p-4 text-sm leading-relaxed",
        isInvoicePair ? adminAlertWarning : adminAlertInfo
      )}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="size-3.5 shrink-0" />
        {isInvoicePair ? "Számlázz.hu pár" : "Kapcsolódó sablon"}
      </p>
      <p>{relation.note}</p>
      <ul className="flex flex-wrap gap-2">
        {relation.relatedTypes.map((related) => (
          <li key={related}>
            <Link
              href={`/admin/emails/${related}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:opacity-90",
                isInvoicePair
                  ? "bg-amber-500/15 text-amber-900 hover:bg-amber-500/25"
                  : "bg-background text-foreground hover:bg-muted"
              )}
            >
              → {relatedTitle(related)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
