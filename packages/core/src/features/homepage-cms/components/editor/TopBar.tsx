"use client"

import type { ReactNode } from "react"

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
  /** Extra controls before “Kilépés” (e.g. “Tartalom mezők” for immersive non-home CMS). */
  toolbarEnd?: ReactNode
}

export function TopBar({
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
    <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-white/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onSave} className="px-3 h-9 bg-primary text-white text-xs uppercase">
          Piszkozat mentése
        </button>
        <button type="button" onClick={onReview} className="px-3 h-9 border border-sky-400/60 text-sky-200 text-xs uppercase">
          Előnézet
        </button>
        <button type="button" onClick={onOpenSettings} className="px-3 h-9 border border-violet-400/60 text-violet-200 text-xs uppercase">
          Weboldal beállítások
        </button>
        <button type="button" onClick={onPublish} className="px-3 h-9 bg-green-600 text-white text-xs uppercase">
          Közzététel
        </button>
        <button type="button" onClick={onDiscard} className="px-3 h-9 border border-red-500 text-red-300 text-xs uppercase">
          Elvetés
        </button>
        <span className={`text-xs uppercase tracking-widest px-2 ${dirty ? "text-amber-300" : "text-emerald-300"}`}>
          {dirty ? "Nem mentett módosítások" : "Mentve"}
        </span>
        <div className="w-px h-6 bg-white/15 mx-1" />
        {(["desktop", "tablet", "mobile"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onDeviceChange(item)}
            className={`px-2 h-9 border text-xs uppercase ${device === item ? "border-primary-foreground/35 text-white" : "border-white/20 text-white/70"}`}
          >
            {item === "desktop" ? "Asztali" : item === "tablet" ? "Tablet" : "Mobil"}
          </button>
        ))}
        <div className="w-px h-6 bg-white/15 mx-1" />
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 h-9 border border-white/20 text-white text-xs uppercase disabled:opacity-40"
        >
          Visszavonás
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="px-3 h-9 border border-white/20 text-white text-xs uppercase disabled:opacity-40"
        >
          Ismét
        </button>
        {toolbarEnd ? (
          <>
            <div className="mx-1 h-6 w-px bg-white/15" />
            {toolbarEnd}
          </>
        ) : null}
        <button type="button" onClick={onExit} className="px-3 h-9 border border-white/20 text-white text-xs uppercase">
          Kilépés
        </button>
      </div>
    </div>
  )
}
