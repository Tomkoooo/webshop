import type { SiteContactEntry } from "@wse/core/lib/site-contact"
import { formatContactEmailsForDisplay } from "@wse/core/lib/contact-emails"
import { cn } from "@wse/core/lib/utils"

type Props = {
  emails: SiteContactEntry[]
  className?: string
  itemClassName?: string
  /** `compact` = inline for footer; `stacked` = contact section */
  variant?: "compact" | "stacked"
}

export function SiteContactEmailsList({
  emails,
  className,
  itemClassName,
  variant = "stacked",
}: Props) {
  if (emails.length === 0) return null

  if (emails.length === 1) {
    return (
      <a
        href={`mailto:${emails[0].email}`}
        className={cn("hover:text-primary-foreground transition-colors", className, itemClassName)}
      >
        {emails[0].email}
      </a>
    )
  }

  if (variant === "compact") {
    return (
      <ul className={cn("space-y-2", className)}>
        {emails.map((entry) => (
          <li key={entry.id} className={itemClassName}>
            <span className="text-neutral-500 text-xs normal-case tracking-normal block mb-0.5">
              {entry.label}
            </span>
            <a href={`mailto:${entry.email}`} className="hover:text-primary-foreground transition-colors uppercase tracking-tighter">
              {entry.email}
            </a>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {emails.map((entry) => (
        <li key={entry.id} className={itemClassName}>
          <span className="text-neutral-500 text-sm uppercase tracking-widest">{entry.label}: </span>
          <a href={`mailto:${entry.email}`} className="hover:text-primary-foreground transition-colors">
            {entry.email}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function siteContactEmailsPlainText(emails: SiteContactEntry[]): string {
  return formatContactEmailsForDisplay(emails)
}
