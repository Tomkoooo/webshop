"use client"

import { cn } from "@wse/core/lib/utils"
import type { LoadedGuideSection } from "@wse/core/lib/admin-guide/types"
import { AdminGuideMarkdown } from "@wse/core/components/admin/guide/AdminGuideMarkdown"

type AdminGuideTocProps = {
  sections: LoadedGuideSection[]
  activeId: string | null
  onNavigate: (id: string) => void
  className?: string
}

export function AdminGuideToc({
  sections,
  activeId,
  onNavigate,
  className,
}: AdminGuideTocProps) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="Súgó tartalomjegyzék">
      <p className="text-muted-foreground mb-2 px-1 text-xs font-medium">Fejezetek</p>
      <ul className="space-y-1">
        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onNavigate(section.id)}
                className={cn(
                  "w-full rounded-md px-2 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {section.title}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AdminGuideSections({ sections }: { sections: LoadedGuideSection[] }) {
  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-24 border-b pb-12 last:border-b-0"
        >
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">{section.title}</h2>
          <div className="prose prose-neutral max-w-none">
            <AdminGuideMarkdown markdown={section.markdown} />
          </div>
        </section>
      ))}
    </div>
  )
}
