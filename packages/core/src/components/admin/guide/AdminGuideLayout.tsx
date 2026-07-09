"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { Card, CardContent } from "@wse/core/components/ui/card"
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
    <AdminPageScaffold
      title="Súgó"
      description={
        <>
          Útmutató az admin felülethez. A fejezetek a telepítéshez (
          <code className="rounded bg-muted px-1 py-0.5 text-sm">{deploymentLabel}</code>) igazodnak.
        </>
      }
    >
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTocOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium"
        >
          Tartalomjegyzék
          <ChevronDown className={cn("size-4 transition-transform", mobileTocOpen && "rotate-180")} />
        </button>
        {mobileTocOpen ? (
          <Card className="mt-2">
            <CardContent className="pt-4">
              <AdminGuideToc sections={sections} activeId={activeId} onNavigate={scrollToSection} />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <Card className="sticky top-4">
            <CardContent className="max-h-[calc(100vh-6rem)] overflow-y-auto pt-4">
              <AdminGuideToc sections={sections} activeId={activeId} onNavigate={scrollToSection} />
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 flex-1">
          <AdminGuideSections sections={sections} />
        </div>
      </div>
    </AdminPageScaffold>
  )
}
