"use client"

import type { ReactNode } from "react"
import { Monitor, Redo2, Save, Smartphone, Tablet, Undo2, X } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"

type Props = {
  dirty: boolean
  device: "desktop" | "tablet" | "mobile"
  onDeviceChange: (device: "desktop" | "tablet" | "mobile") => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onReview: () => void
  onOpenSettings: () => void
  onPublish: () => void
  onDiscard: () => void
  onExit: () => void
  toolbarEnd?: ReactNode
}

const devices = [
  { id: "desktop" as const, label: "Asztali", icon: Monitor },
  { id: "tablet" as const, label: "Tablet", icon: Tablet },
  { id: "mobile" as const, label: "Mobil", icon: Smartphone },
]

export function CmsEditorToolbar({
  dirty,
  device,
  onDeviceChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onReview,
  onOpenSettings,
  onPublish,
  onDiscard,
  onExit,
  toolbarEnd,
}: Props) {
  return (
    <div className="cms-editor-toolbar sticky top-0 z-50 border-b border-border/40 bg-background/95 px-4 py-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={onSave}>
          <Save className="size-4" />
          Piszkozat mentése
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onReview}>
          Előnézet
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onOpenSettings}>
          Weboldal beállítások
        </Button>
        <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onPublish}>
          Közzététel
        </Button>
        <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={onDiscard}>
          Elvetés
        </Button>

        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            dirty ? "bg-warning/15 text-warning-foreground" : "bg-success/15 text-success"
          )}
        >
          {dirty ? "Nem mentett módosítások" : "Mentve"}
        </span>

        <div className="mx-1 hidden h-6 w-px bg-border/60 sm:block" />

        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          {devices.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={device === id ? "secondary" : "ghost"}
              className="h-8 gap-1.5 px-2.5"
              onClick={() => onDeviceChange(id)}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>

        <div className="mx-1 hidden h-6 w-px bg-border/60 sm:block" />

        <Button type="button" size="sm" variant="outline" disabled={!canUndo} onClick={onUndo}>
          <Undo2 className="size-4" />
          Visszavonás
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!canRedo} onClick={onRedo}>
          <Redo2 className="size-4" />
          Ismét
        </Button>

        {toolbarEnd ? (
          <>
            <div className="mx-1 h-6 w-px bg-border/60" />
            {toolbarEnd}
          </>
        ) : null}

        <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={onExit}>
          <X className="size-4" />
          Kilépés
        </Button>
      </div>
    </div>
  )
}
