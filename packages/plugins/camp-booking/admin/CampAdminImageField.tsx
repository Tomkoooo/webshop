"use client"

import { useRef, useState } from "react"
import { mediaImageSrc } from "@wse/core/lib/images"
import { CampAdminField, CampAdminInput } from "./camp-admin-ui"
import { Button } from "@wse/core/components/ui/button"

export function CampAdminImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append("file", file, file.name)
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) {
        throw new Error(typeof data.error === "string" ? data.error : "Feltöltés sikertelen")
      }
      onChange(data.url as string)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Feltöltés sikertelen")
    } finally {
      setUploading(false)
    }
  }

  return (
    <CampAdminField label={label}>
      <div className="space-y-3">
        {value ? (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaImageSrc(value)}
              alt=""
              className="w-24 h-24 object-cover rounded-lg border border-border"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange("")}
              className="h-9 text-xs"
            >
              Kép törlése
            </Button>
          </div>
        ) : null}
        <CampAdminInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/api/media/… vagy feltöltés"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void uploadFile(file)
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="h-9 text-xs"
        >
          {uploading ? "Feltöltés…" : "Kép feltöltése"}
        </Button>
        {uploadError ? <p className="text-destructive text-xs">{uploadError}</p> : null}
      </div>
    </CampAdminField>
  )
}
