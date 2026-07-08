"use client"

import { useCallback, useMemo, useState } from "react"
import Cropper from "react-easy-crop"
import { Check, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react"
import getCroppedImg from "@wse/core/lib/crop-utils"
import {
  buildAspectPresets,
  defaultFlexiblePresetId,
  type AspectPreset,
} from "@wse/core/components/admin/admin-image-crop"

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

  return (
    <div className="space-y-2">
      {usageLabel ? (
        <p className="text-[10px] uppercase tracking-widest text-neutral-400">
          Cél: <span className="text-neutral-200">{usageLabel}</span>
        </p>
      ) : null}
      {recommendedSize ? (
        <p className="text-[10px] uppercase tracking-widest text-neutral-500">
          Javasolt méret: {recommendedSize.width} x {recommendedSize.height}px
          {flexible ? (
            <span className="block normal-case text-neutral-600 mt-0.5">
              Válaszd ki a kivágás alakját lent — nem csak banner méretben.
            </span>
          ) : null}
        </p>
      ) : null}
      <label className="inline-flex items-center gap-2 text-xs uppercase text-white">
        <span>{label}</span>
        <input
          type="file"
          accept="image/*"
          disabled={loading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
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
            event.target.value = ""
          }}
        />
      </label>
      {fileMeta ? (
        <p className="text-[10px] text-neutral-500">
          Feltöltött kép: {fileMeta.width} x {fileMeta.height}px
        </p>
      ) : null}

      {imageSource ? (
        <div className="fixed inset-0 z-100 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[80vh] max-h-[90vh]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Kép szerkesztés</h3>
                <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">
                  {useFullImage ? "Teljes kép feltöltése" : "Válaszd ki a kivágás alakját, majd igazítsd a képet"}
                </p>
              </div>
              <button type="button" onClick={resetEditor} className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {flexible ? (
              <div className="px-4 py-3 border-b border-white/5 space-y-3 bg-black/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Kivágás alakja</p>
                <div className="flex flex-wrap gap-2">
                  {aspectPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectPreset(preset.id)}
                      className={`px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        selectedPresetId === preset.id
                          ? "border-primary-foreground/35 text-white bg-primary/20"
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

            {useFullImage ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-black text-center min-h-0">
                <p className="text-sm text-neutral-300 max-w-md">
                  A teljes kép feltöltődik — nincs kivágás. Ideális előre elkészített logókhoz és bannerekhez.
                </p>
                {fileMeta ? (
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                    {fileMeta.width} x {fileMeta.height}px
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="relative flex-1 bg-black min-h-0">
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

            <div className="p-6 bg-black/40 border-t border-white/5 space-y-6 shrink-0">
              {!useFullImage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      <span>Nagyítás</span>
                      <span className="text-primary-foreground">{Math.round(zoom * 100)}%</span>
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
                      <span className="text-primary-foreground">{rotation}°</span>
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
              ) : null}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={resetEditor}
                  className="h-10 px-5 border border-white/20 text-white rounded-xl uppercase tracking-widest text-xs"
                >
                  Mégse
                </button>
                <button
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
                  className="h-10 px-6 bg-primary text-white rounded-xl uppercase tracking-widest text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Alkalmaz és feltölt
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
