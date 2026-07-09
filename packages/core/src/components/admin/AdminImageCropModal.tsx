"use client"

import { useCallback, useMemo, useState } from "react"
import Cropper from "react-easy-crop"
import { Check, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import getCroppedImg from "@wse/core/lib/crop-utils"
import {
  buildAspectPresets,
  defaultFlexiblePresetId,
  type AspectPreset,
} from "@wse/core/components/admin/admin-image-crop"
import { adminFieldHint, adminInputClass } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

export type AdminImageCropModalProps = {
  image: string
  onCropComplete: (croppedImage: Blob) => void
  onCancel: () => void
  /** Fixed aspect when flexibleCrop is false */
  aspect?: number
  flexibleCrop?: boolean
  recommendedAspect?: number
  title?: string
  subtitle?: string
  applyLabel?: string
}

export function AdminImageCropModal({
  image,
  onCropComplete,
  onCancel,
  aspect = 1,
  flexibleCrop = false,
  recommendedAspect,
  title = "Kép vágása",
  subtitle = "Igazítsa be a képet",
  applyLabel = "Alkalmaz",
}: AdminImageCropModalProps) {
  const aspectPresets = useMemo(
    () => buildAspectPresets(recommendedAspect ?? aspect),
    [recommendedAspect, aspect]
  )

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [selectedPresetId, setSelectedPresetId] = useState(() =>
    flexibleCrop ? defaultFlexiblePresetId(aspectPresets) : (aspectPresets[0]?.id ?? "square")
  )
  const [customAspectW, setCustomAspectW] = useState(4)
  const [customAspectH, setCustomAspectH] = useState(3)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [applying, setApplying] = useState(false)

  const selectedPreset = aspectPresets.find((p) => p.id === selectedPresetId) ?? aspectPresets[0]
  const useCustomAspect = flexibleCrop && selectedPresetId === "custom"
  const cropperAspect = useCustomAspect
    ? customAspectW / Math.max(1, customAspectH)
    : flexibleCrop
      ? selectedPreset?.aspect && selectedPreset.aspect > 0
        ? selectedPreset.aspect
        : aspect
      : aspect

  const selectPreset = (id: string) => {
    setSelectedPresetId(id)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const handleCrop = async () => {
    if (!croppedAreaPixels) return
    setApplying(true)
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation)
      if (croppedImage) onCropComplete(croppedImage)
    } catch (e) {
      console.error(e)
    } finally {
      setApplying(false)
    }
  }

  const onCropCompleteInternal = useCallback((_area: unknown, areaPixels: typeof croppedAreaPixels) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const cropperKey = `${selectedPresetId}-${cropperAspect}`

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 p-4 backdrop-blur-xl md:p-8 animate-in fade-in duration-300">
      <div className="flex h-[80vh] max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className={adminFieldHint}>{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {flexibleCrop ? (
          <div className="shrink-0 space-y-3 border-b border-border/50 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Kivágás alakja</p>
            <div className="flex flex-wrap gap-2">
              {aspectPresets.map((preset: AspectPreset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.id)}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
                    selectedPresetId === preset.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {useCustomAspect ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-foreground">
                <span className="text-sm text-muted-foreground">Szélesség : magasság</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customAspectW}
                  onChange={(e) => setCustomAspectW(Math.max(1, Number(e.target.value) || 1))}
                  className={cn(adminInputClass, "h-8 w-16 text-center")}
                />
                <span>:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customAspectH}
                  onChange={(e) => setCustomAspectH(Math.max(1, Number(e.target.value) || 1))}
                  className={cn(adminInputClass, "h-8 w-16 text-center")}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1 bg-background">
          <Cropper
            key={cropperKey}
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={cropperAspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        <div className="shrink-0 space-y-6 border-t border-border/50 p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Nagyítás</span>
                <span className="text-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-accent"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Forgatás</span>
                <span className="text-foreground">{rotation}°</span>
              </div>
              <div className="flex items-center gap-4">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-accent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Mégse
            </Button>
            <Button
              type="button"
              disabled={applying || !croppedAreaPixels}
              onClick={handleCrop}
              className="flex items-center gap-2"
            >
              <Check className="h-5 w-5" />
              {applyLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
