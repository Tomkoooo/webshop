"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@wse/core/lib/utils"
import type { LoadedGuideSection } from "@wse/core/lib/admin-guide/types"
import { AdminGuideSections, AdminGuideToc } from "@wse/core/components/admin/guide/AdminGuideContent"

export function AdminGuideLayout({
  sections,
  deploymentLabel,
}: {
  sections: LoadedGuideSection[]
  deploymentLabel: string
}) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null)
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const scrollToSection = useCallback((id: string) => {
    setActiveId(id)
    setMobileTocOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) {
          setActiveId(visible.target.id)
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] }
    )

    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          Súgó <span className="admin-text-accent">admin</span>
        </h1>
        <p className="text-sm text-neutral-400 max-w-3xl">
          Részletes útmutató az admin felülethez. A megjelenő fejezetek a telepítéshez (
          <span className="text-neutral-300">{deploymentLabel}</span>) igazodnak.
        </p>
      </header>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTocOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white"
        >
          Tartalomjegyzék
          <ChevronDown className={cn("h-4 w-4 transition-transform", mobileTocOpen && "rotate-180")} />
        </button>
        {mobileTocOpen ? (
          <div className="mt-2 rounded-lg border border-white/10 bg-[#111113] p-3">
            <AdminGuideToc
              sections={sections}
              activeId={activeId}
              onNavigate={scrollToSection}
            />
          </div>
        ) : null}
      </div>

      <div className="flex gap-10">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2">
            <AdminGuideToc
              sections={sections}
              activeId={activeId}
              onNavigate={scrollToSection}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <AdminGuideSections sections={sections} />
        </div>
      </div>
    </div>
  )
}
