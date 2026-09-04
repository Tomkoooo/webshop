"use client"

import { useState, type ReactNode } from "react"
import { LayoutList, LayoutPanelLeft, Menu, PanelBottom } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { DevicePreview } from "@wse/core/features/homepage-cms/components/editor/DevicePreview"
import { cn } from "@wse/core/lib/utils"

export type CmsChromePanel = {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

const defaultIcons: Record<string, ReactNode> = {
  nav: <Menu className="size-3.5" aria-hidden />,
  footer: <PanelBottom className="size-3.5" aria-hidden />,
  sections: <LayoutPanelLeft className="size-3.5" aria-hidden />,
  lists: <LayoutList className="size-3.5" aria-hidden />,
}

/**
 * Toggle bar + optional aside for CMS chrome panels (navigation, footer, sections).
 * Panels are hidden by default — operators open only what they need.
 */
export function CmsChromePanelLayout({
  panels,
  device,
  children,
  className,
}: {
  panels: CmsChromePanel[]
  device: "desktop" | "tablet" | "mobile"
  children: ReactNode
  className?: string
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    // Open section visibility panel by default so hide/show is easy to find.
    return panels.some((p) => p.id === "sections") ? new Set(["sections"]) : new Set()
  })

  if (!panels.length) {
    return <div className={className}>{children}</div>
  }

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openPanels = panels.filter((p) => openIds.has(p.id))

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Szerkesztő panelek:</span>
        {panels.map((panel) => {
          const active = openIds.has(panel.id)
          return (
            <Button
              key={panel.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="h-8 gap-1.5"
              aria-pressed={active}
              onClick={() => toggle(panel.id)}
            >
              {panel.icon ?? defaultIcons[panel.id]}
              {panel.label}
            </Button>
          )
        })}
      </div>

      <div className="flex flex-col items-start gap-4 xl:flex-row">
        <div className="min-w-0 flex-1">
          <DevicePreview device={device}>{children}</DevicePreview>
        </div>
        {openPanels.length > 0 ? (
          <div className="flex w-full shrink-0 flex-col gap-4 xl:sticky xl:top-4 xl:max-w-sm">
            {openPanels.map((panel) => (
              <div key={panel.id}>{panel.content}</div>
            ))}
          </div>
        ) : null}
      </div>

      {openPanels.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nyisd meg a fenti gombokkal a navigáció, lábléc vagy szekció szerkesztőt. A{" "}
          <strong>Szekciók</strong> panelben kapcsolhatod ki/be a galériát, kapcsolatot és a többi
          blokkot.
        </p>
      ) : null}
    </div>
  )
}
