"use client"

import { useState } from "react"
import { ImageUpload } from "@wse/core/components/admin/ImageUpload"
import { MultiImageUpload } from "@wse/core/components/admin/MultiImageUpload"
import { TBookField, TBookInput } from "./t-book-admin-ui"

type Mode = "upload" | "url"

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="flex gap-2 mb-3">
      {(["upload", "url"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === tab
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab === "upload" ? "Feltöltés" : "URL / link"}
        </button>
      ))}
    </div>
  )
}

export function TBookSingleMediaField({
  label,
  value,
  onChange,
  aspect = 16 / 9,
}: {
  label: string
  value: string
  onChange: (filenameOrUrl: string) => void
  aspect?: number
}) {
  const [mode, setMode] = useState<Mode>(value && !value.startsWith("http") ? "upload" : "url")

  return (
    <TBookField label={label}>
      <ModeTabs mode={mode} onChange={setMode} />
      {mode === "upload" ? (
        <ImageUpload currentImage={value} onUpload={onChange} aspect={aspect} />
      ) : (
        <TBookInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… vagy /api/media/fájlnév"
        />
      )}
    </TBookField>
  )
}

export function TBookGalleryField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string[]
  onChange: (images: string[]) => void
}) {
  const [mode, setMode] = useState<Mode>("upload")

  return (
    <TBookField label={label}>
      <ModeTabs mode={mode} onChange={setMode} />
      {mode === "upload" ? (
        <MultiImageUpload currentImages={value} onUpload={onChange} aspect={4 / 3} />
      ) : (
        <textarea
          className="w-full min-h-24 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          value={value.join("\n")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="Kép URL-ek soronként"
        />
      )}
    </TBookField>
  )
}
