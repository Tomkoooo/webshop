"use client"

import { useCallback, useId, useMemo, useState } from "react"
import Cropper from "react-easy-crop"
import { Check, RotateCcw, Upload, X, ZoomIn, ZoomOut } from "lucide-react"
import getCroppedImg from "@wse/core/lib/crop-utils"
import {
  buildAspectPresets,
  defaultFlexiblePresetId,
} from "@wse/core/components/admin/admin-image-crop"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

export function UploadSheet({
  onUploaded,
  label = "Kép feltöltése",
  usageLabel,
  recommendedSize,
  aspect,
  allowRectangleCrop = false,
  allowSkipCrop = false,
}: {
  onUploaded: (url: string) => void
  label?: string
  usageLabel?: string
  recommendedSize?: { width: number; height: number }
  aspect?: number
  allowRectangleCrop?: boolean
  allowSkipCrop?: boolean
}) {
  const fileInputId = useId()
  const flexible = allowRectangleCrop || allowSkipCrop
  const aspectPresets = useMemo(() => buildAspectPresets(aspect), [aspect])

  const [loading, setLoading] = useState(false)
  const [imageSource, setImageSource] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [fileMeta, setFileMeta] = useState<{ width: number; height: number } | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [selectedPresetId, setSelectedPresetId] = useState(() =>
    flexible ? defaultFlexiblePresetId(aspectPresets) : (aspectPresets[0]?.id ?? "square")
  )
  const [customAspectW, setCustomAspectW] = useState(4)
  const [customAspectH, setCustomAspectH] = useState(3)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const selectedPreset = aspectPresets.find((p) => p.id === selectedPresetId) ?? aspectPresets[0]
  const useFullImage = flexible && selectedPreset?.aspect === null
  const useCustomAspect = flexible && selectedPresetId === "custom"
  const cropperAspect = useCustomAspect
    ? customAspectW / Math.max(1, customAspectH)
    : flexible
      ? selectedPreset?.aspect && selectedPreset.aspect > 0
        ? selectedPreset.aspect
        : (aspect ?? 1)
      : (aspect ?? 1)

  const uploadBlob = useCallback(
    async (blob: Blob, filename: string) => {
      const formData = new FormData()
      formData.append("file", blob, filename)
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        console.error("[upload]", data?.error || response.statusText)
        throw new Error(typeof data?.error === "string" ? data.error : "Feltöltés sikertelen")
      }
      if (data.url) onUploaded(data.url)
    },
    [onUploaded]
  )

  const resetEditor = () => {
    setImageSource(null)
    setSourceFile(null)
    setFileMeta(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setSelectedPresetId(flexible ? defaultFlexiblePresetId(aspectPresets) : (aspectPresets[0]?.id ?? "square"))
    setCroppedAreaPixels(null)
  }

  const uploadOriginal = async () => {
    if (!sourceFile) return
    setLoading(true)
    try {
      await uploadBlob(sourceFile, sourceFile.name)
      resetEditor()
    } catch (err) {
      console.error(err)
      window.alert(err instanceof Error ? err.message : "Feltöltés sikertelen")
    } finally {
      setLoading(false)
    }
  }

  const selectPreset = (id: string) => {
    setSelectedPresetId(id)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const cropperKey = `${selectedPresetId}-${cropperAspect}`

  const onFileSelected = (file: File) => {
    setSourceFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? "")
      const image = new Image()
      image.onload = () => {
        setFileMeta({ width: image.width, height: image.height })
        setImageSource(result)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setSelectedPresetId(flexible ? defaultFlexiblePresetId(aspectPresets) : (aspectPresets[0]?.id ?? "square"))
      }
      image.src = result
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      {usageLabel && !recommendedSize ? (
        <p className="text-xs text-muted-foreground">{usageLabel}</p>
      ) : null}
      {recommendedSize ? (
        <p className="text-xs text-muted-foreground">
          Javasolt méret: {recommendedSize.width}×{recommendedSize.height}px
          {flexible ? " · a kivágás alakja a feltöltés után választható" : null}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={loading} asChild>
          <label htmlFor={fileInputId} className="cursor-pointer">
            <Upload className="size-3.5" />
            {label}
          </label>
        </Button>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          disabled={loading}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFileSelected(file)
            event.target.value = ""
          }}
        />
        {fileMeta && !imageSource ? (
          <span className="text-xs text-muted-foreground">
            Kiválasztva: {fileMeta.width}×{fileMeta.height}px
          </span>
        ) : null}
      </div>

      {/* In-shell overlay (not Radix Dialog) — avoids portal/aria-hidden blanking the admin form. */}
      {imageSource ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 p-4 backdrop-blur-xl md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${fileInputId}-crop-title`}
        >
          <div className="flex h-[80vh] max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border/60">
            <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 py-3">
              <div>
                <h3 id={`${fileInputId}-crop-title`} className="text-lg font-semibold text-foreground">
                  Kép szerkesztése
                </h3>
                <p className="text-xs text-muted-foreground">
                  {useFullImage
                    ? "A teljes kép feltöltődik kivágás nélkül."
                    : "Válaszd ki a kivágás alakját, majd igazítsd a képet."}
                </p>
              </div>
              <button
                type="button"
                onClick={resetEditor}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Bezárás"
              >
                <X className="size-5" />
              </button>
            </div>

            {flexible ? (
              <div className="space-y-3 border-b border-border/50 bg-muted/20 px-4 py-3">
                <Label className={adminFieldLabel}>Kivágás alakja</Label>
                <div className="flex flex-wrap gap-2">
                  {aspectPresets.map((preset) => (
                    <Button
                      key={preset.id}
                      type="button"
                      size="sm"
                      variant={selectedPresetId === preset.id ? "secondary" : "outline"}
                      onClick={() => selectPreset(preset.id)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                {useCustomAspect ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className={cn(adminFieldLabel, "shrink-0")}>Szélesség : magasság</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={customAspectW}
                      onChange={(e) => setCustomAspectW(Math.max(1, Number(e.target.value) || 1))}
                      className="h-8 w-16 text-center"
                    />
                    <span className="text-muted-foreground">:</span>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={customAspectH}
                      onChange={(e) => setCustomAspectH(Math.max(1, Number(e.target.value) || 1))}
                      className="h-8 w-16 text-center"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {useFullImage ? (
              <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="max-w-md text-sm text-muted-foreground">
                  A teljes kép feltöltődik — nincs kivágás. Ideális előre elkészített logókhoz és
                  bannerekhez.
                </p>
                {fileMeta ? (
                  <p className="text-xs text-muted-foreground">
                    {fileMeta.width}×{fileMeta.height}px
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="relative min-h-[280px] flex-1 bg-neutral-950">
                <Cropper
                  key={cropperKey}
                  image={imageSource}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={cropperAspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              </div>
            )}

            <div className="space-y-4 border-t border-border/50 bg-muted/20 p-4">
              {!useFullImage ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Nagyítás</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="h-1 flex-1 cursor-pointer accent-primary"
                      />
                      <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Forgatás</span>
                      <span>{rotation}°</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RotateCcw className="size-4 shrink-0 text-muted-foreground" />
                      <input
                        type="range"
                        value={rotation}
                        min={0}
                        max={360}
                        step={1}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="h-1 flex-1 cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetEditor}>
                  <X className="size-4" />
                  Mégse
                </Button>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    if (useFullImage) {
                      await uploadOriginal()
                      return
                    }
                    if (!imageSource || !croppedAreaPixels) return
                    setLoading(true)
                    try {
                      const croppedBlob = await getCroppedImg(imageSource, croppedAreaPixels, rotation)
                      if (!croppedBlob) return
                      await uploadBlob(croppedBlob, "edited-image.jpg")
                      resetEditor()
                    } catch (err) {
                      console.error(err)
                      window.alert(err instanceof Error ? err.message : "Feltöltés sikertelen")
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  <Check className="size-4" />
                  Alkalmaz és feltölt
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
