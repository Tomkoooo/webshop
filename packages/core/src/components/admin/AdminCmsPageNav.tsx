import Link from "next/link"
import type { EditablePageNavItem } from "@wse/core/templates/cms-pages"
import { cn } from "@wse/core/lib/utils"

type SettingsSectionLink = {
  id: string
  label: string
}

const navLinkClass =
  "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"

export function AdminCmsPageNav({
  editablePages,
  activeSegment,
  showSettingsLink = true,
  settingsSections = [],
}: {
  editablePages: EditablePageNavItem[]
  activeSegment?: string
  showSettingsLink?: boolean
  settingsSections?: SettingsSectionLink[]
}) {
  return (
    <nav className="flex flex-col gap-2">
      {showSettingsLink ? (
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-1">
          <Link
            href="/admin/cms/settings"
            className={cn(
              navLinkClass,
              "bg-background text-foreground shadow-sm"
            )}
          >
            Weboldal beállítások
          </Link>
          {settingsSections.map((section) => (
            <Link
              key={section.id}
              href={`/admin/cms/settings?section=${section.id}`}
              className={cn(
                navLinkClass,
                "text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              {section.label}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-1">
        {editablePages.map((p) => {
          const isActive = p.adminSegment === activeSegment
          return (
            <Link
              key={p.adminSegment}
              href={`/admin/cms/${p.adminSegment}`}
              className={cn(
                navLinkClass,
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              {p.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
