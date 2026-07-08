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
  const useFullImage = flexibleCrop && selectedPreset?.aspect === null
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
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[80vh] max-h-[90vh]">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h3 className="text-lg font-bold text-white uppercase italic tracking-wider">{title}</h3>
            <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {flexibleCrop ? (
          <div className="px-4 py-3 border-b border-white/5 space-y-3 bg-black/30 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Kivágás alakja</p>
            <div className="flex flex-wrap gap-2">
              {aspectPresets.map((preset: AspectPreset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.id)}
                  className={`px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    selectedPresetId === preset.id
                      ? "border-white/40 text-white bg-white/15"
                      : "border-white/15 text-neutral-400 hover:border-white/30"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {useCustomAspect ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                <span className="uppercase tracking-widest text-[10px] text-neutral-500">Szélesség : magasság</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customAspectW}
                  onChange={(e) => setCustomAspectW(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 h-8 px-2 bg-black border border-white/20 rounded text-white text-center"
                />
                <span>:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customAspectH}
                  onChange={(e) => setCustomAspectH(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 h-8 px-2 bg-black border border-white/20 rounded text-white text-center"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="relative flex-1 bg-black min-h-0">
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

        <div className="p-6 bg-black/40 border-t border-white/5 space-y-6 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <span>Nagyítás</span>
                <span className="text-white">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut className="w-4 h-4 text-neutral-600" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-accent h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-neutral-600" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <span>Forgatás</span>
                <span className="text-white">{rotation}°</span>
              </div>
              <div className="flex items-center gap-4">
                <RotateCcw className="w-4 h-4 text-neutral-600" />
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-accent h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-12 px-6 border-white/10 text-white hover:bg-white/5 rounded-xl uppercase tracking-widest text-xs font-bold"
            >
              Mégse
            </Button>
            <Button
              type="button"
              disabled={applying || !croppedAreaPixels}
              onClick={handleCrop}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-sm rounded-xl flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              {applyLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
