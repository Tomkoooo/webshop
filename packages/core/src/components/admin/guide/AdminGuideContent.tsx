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
      <p className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">
        Tartalomjegyzék
      </p>
      <ul className="space-y-1">
        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onNavigate(section.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-bold transition-colors rounded-sm",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
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
    <div className="space-y-16">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-24 border-b border-white/10 pb-16 last:border-b-0"
        >
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">
            {section.title}
          </h2>
          <div className="prose max-w-none">
            <AdminGuideMarkdown markdown={section.markdown} />
          </div>
        </section>
      ))}
    </div>
  )
}
