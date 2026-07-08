import Link from "next/link"
import type { EditablePageNavItem } from "@wse/core/templates/cms-pages"
type SettingsSectionLink = {
  id: string
  label: string
}

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
    <nav className="flex flex-col gap-3 sm:items-end">
      {showSettingsLink ? (
        <div className="flex flex-wrap gap-2 justify-end">
          <Link
            href="/admin/cms/settings"
            className="rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-violet-200 hover:bg-violet-500/20"
          >
            Weboldal beállítások
          </Link>
          {settingsSections.map((section) => (
            <Link
              key={section.id}
              href={`/admin/cms/settings?section=${section.id}`}
              className="rounded-md border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:border-white/25 hover:text-white"
            >
              {section.label}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 justify-end">
        {editablePages.map((p) => {
          const isActive = p.adminSegment === activeSegment
          return (
            <Link
              key={p.adminSegment}
              href={`/admin/cms/${p.adminSegment}`}
              className={
                isActive
                  ? "rounded-md bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white"
                  : "rounded-md border border-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white"
              }
            >
              {p.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
