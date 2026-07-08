"use client"

import { useState } from "react"
import { Button } from "@wse/core/components/ui/button"
import { pressAdminInputClass } from "./press-admin-ui"
import { Input } from "@wse/core/components/ui/input"
import { cn } from "@wse/core/lib/utils"

type Props = {
  value: string
  onChange: (filename: string) => void
}

export function PressPdfUploadField({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(file: File | null) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Csak PDF fájl tölthető fel.")
      return
    }
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.set("file", file)
      const res = await fetch("/api/media", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Feltöltés sikertelen")
      onChange(data.filename)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feltöltés sikertelen")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/api/media/… vagy feltöltés"
          className={cn("max-w-md", pressAdminInputClass)}
        />
        <label>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="rounded-none border-white/10 h-11 uppercase text-[10px] font-black tracking-widest"
            asChild
          >
            <span>{uploading ? "Feltöltés…" : "PDF feltöltése"}</span>
          </Button>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0] || null)}
          />
        </label>
      </div>
      {value ? (
        <p className="text-xs text-white/50">Aktív fájl: {value}</p>
      ) : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
