import type { ReactNode } from "react"
import { AdminCmsPageNav } from "@wse/core/components/admin/AdminCmsPageNav"
import type { EditablePageNavItem } from "@wse/core/templates/cms-pages"
import { cn } from "@wse/core/lib/utils"

/**
 * Full-bleed shell for inline CMS visual editors — avoids duplicating AdminPageScaffold
 * chrome (title, back link) on top of the editor's own toolbar.
 */
export function CmsVisualEditorPageLayout({
  editablePages,
  activeSegment,
  settingsSections,
  children,
  className,
}: {
  editablePages: EditablePageNavItem[]
  activeSegment: string
  settingsSections: Array<{ id: string; label: string }>
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("-mx-4 -mt-2 flex flex-col gap-3 md:-mx-0", className)}>
      <div className="px-4 md:px-0">
        <AdminCmsPageNav
          editablePages={editablePages}
          activeSegment={activeSegment}
          settingsSections={settingsSections}
        />
      </div>
      {children}
    </div>
  )
}
