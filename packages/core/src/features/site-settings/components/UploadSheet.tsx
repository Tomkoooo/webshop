"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Cropper from "react-easy-crop"
import { Check, RotateCcw, Upload, X, ZoomIn, ZoomOut } from "lucide-react"
import getCroppedImg, { preferredCropOutput } from "@wse/core/lib/crop-utils"
import {
  buildAspectPresets,
  defaultFlexiblePresetId,
} from "@wse/core/components/admin/admin-image-crop"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

function clearStuckA11yLocks() {
  if (typeof document === "undefined") return
  document.querySelectorAll("[data-aria-hidden]").forEach((el) => {
    el.removeAttribute("data-aria-hidden")
    el.removeAttribute("aria-hidden")
  })
  document.querySelectorAll("[data-inert-ed]").forEach((el) => {
    el.removeAttribute("data-inert-ed")
    el.removeAttribute("inert")
  })
}

export function UploadSheet({
  onUploaded,
  label = "Upload image",
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
  const inputRef = useRef<HTMLInputElement>(null)
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
        throw new Error(typeof data?.error === "string" ? data.error : "Upload failed")
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
    requestAnimationFrame(() => clearStuckA11yLocks())
  }

  useEffect(() => {
    if (!imageSource) return
    return () => {
      clearStuckA11yLocks()
    }
  }, [imageSource])

  const uploadOriginal = async () => {
    if (!sourceFile) return
    setLoading(true)
    try {
      await uploadBlob(sourceFile, sourceFile.name)
      resetEditor()
    } catch (err) {
      console.error(err)
      window.alert(err instanceof Error ? err.message : "Upload failed")
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
    const name = file.name.toLowerCase()
    const isSvg = file.type === "image/svg+xml" || name.endsWith(".svg")
    // Keep SVGs as vectors — cropping rasterizes and JPEG fills transparency with black.
    if (isSvg) {
      void (async () => {
        setLoading(true)
        try {
          await uploadBlob(file, file.name)
        } catch (err) {
          console.error(err)
          window.alert(err instanceof Error ? err.message : "Upload failed")
        } finally {
          setLoading(false)
        }
      })()
      return
    }

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

  const overlay = imageSource ? (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 p-4 md:p-8"
      role="dialog"
      aria-labelledby={`${fileInputId}-crop-title`}
    >
      <div className="flex h-[80vh] max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border/60">
        <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 py-3">
          <div>
            <h3 id={`${fileInputId}-crop-title`} className="text-lg font-semibold text-foreground">
              Edit image
            </h3>
            <p className="text-xs text-muted-foreground">
              {useFullImage
                ? "The full image will upload without cropping."
                : "Choose a crop shape, then adjust the image."}
            </p>
          </div>
          <button
            type="button"
            onClick={resetEditor}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {flexible ? (
          <div className="space-y-3 border-b border-border/50 bg-muted/20 px-4 py-3">
            <Label className={adminFieldLabel}>Crop shape</Label>
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
                <Label className={cn(adminFieldLabel, "shrink-0")}>Width : height</Label>
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
              The full image uploads without cropping. Ideal for prepared logos and banners.
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
                  <span>Zoom</span>
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
                  <span>Rotate</span>
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
              Cancel
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
                  const output = preferredCropOutput(imageSource)
                  const croppedBlob = await getCroppedImg(
                    imageSource,
                    croppedAreaPixels,
                    rotation,
                    undefined,
                    output.mime
                  )
                  if (!croppedBlob) return
                  await uploadBlob(croppedBlob, output.filename)
                  resetEditor()
                } catch (err) {
                  console.error(err)
                  window.alert(err instanceof Error ? err.message : "Upload failed")
                } finally {
                  setLoading(false)
                }
              }}
            >
              <Check className="size-4" />
              Apply and upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="space-y-2">
      {usageLabel && !recommendedSize ? (
        <p className="text-xs text-muted-foreground">{usageLabel}</p>
      ) : null}
      {recommendedSize ? (
        <p className="text-xs text-muted-foreground">
          Recommended size: {recommendedSize.width}×{recommendedSize.height}px
          {flexible ? " · crop shape can be chosen after upload" : null}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-3.5" />
          {label}
        </Button>
        <input
          ref={inputRef}
          id={fileInputId}
          type="file"
          accept="image/*,.svg"
          disabled={loading}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFileSelected(file)
            event.target.value = ""
          }}
        />
        {fileMeta && !imageSource ? (
          <span className="text-xs text-muted-foreground">
            Selected: {fileMeta.width}×{fileMeta.height}px
          </span>
        ) : null}
      </div>

      {typeof document !== "undefined" && overlay ? createPortal(overlay, document.body) : null}
    </div>
  )
}
