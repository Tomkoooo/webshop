import { useState, useEffect, useCallback } from "react"
import { Upload, X, GripVertical, Star, StarOff } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { ImageCropper } from "./ImageCropper"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"

interface MultiImageUploadProps {
  onUpload: (filenames: string[]) => void
  currentImages?: string[]
  aspect?: number
  flexibleCrop?: boolean
}

export function MultiImageUpload({
  onUpload,
  currentImages = [],
  aspect = 1,
  flexibleCrop = true,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(currentImages)
  const [cropQueue, setCropQueue] = useState<string[]>([])
  const [isCropping, setIsCropping] = useState(false)

  useEffect(() => {
    onUpload(images)
  }, [images])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newQueue: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      const promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
      })
      reader.readAsDataURL(file)
      newQueue.push(await promise)
    }

    setCropQueue(prev => [...prev, ...newQueue])
    setIsCropping(true)
    e.target.value = "" // Reset input
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true)

    const formData = new FormData()
    formData.append("file", croppedBlob, "image.jpg")

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.filename) {
        setImages((prev) => [...prev, data.filename])
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      // Move to next in queue
      setCropQueue(prev => {
        const next = prev.slice(1)
        if (next.length === 0) setIsCropping(false)
        return next
      })
      setUploading(false)
    }
  }

  const handleCancelCrop = () => {
    setCropQueue(prev => {
      const next = prev.slice(1)
      if (next.length === 0) setIsCropping(false)
      return next
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images]
    const nextIndex = direction === 'up' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= images.length) return
    
    [newImages[index], newImages[nextIndex]] = [newImages[nextIndex], newImages[index]]
    setImages(newImages)
  }

  const setAsMain = (index: number) => {
    const newImages = [...images]
    const [main] = newImages.splice(index, 1)
    newImages.unshift(main)
    setImages(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, index) => (
          <div key={img} className="relative group aspect-square bg-black border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-primary/40">
            <FallbackImage
              src={mediaImageSrc(img)}
              alt={`Preview ${index}`} 
              width={240}
              height={240}
              className="w-full h-full object-cover" 
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-end">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="p-1 bg-black/60 backdrop-blur-md rounded-md text-white disabled:opacity-30"
                  >
                    <GripVertical className="w-3 h-3 rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="p-1 bg-black/60 backdrop-blur-md rounded-md text-white disabled:opacity-30"
                  >
                    <GripVertical className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setAsMain(index)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    index === 0 ? "bg-white/20 text-white" : "bg-black/60 text-white hover:text-highlight"
                  )}
                  title={index === 0 ? "Elsődleges kép" : "Legyen elsődleges"}
                >
                  {index === 0 ? <Star className="w-4 h-4 fill-white" /> : <StarOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {index === 0 && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-md">
                Fő kép
              </div>
            )}
            
            <input type="hidden" name="images" value={img} />
          </div>
        ))}

        <label className="relative aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-primary/40 transition-all">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
            {uploading ? <LoadingSpinner size="xs" /> : <Upload className="w-5 h-5 text-neutral-600" />}
          </div>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Képek hozzáadása</span>
          <input type="file" className="hidden" onChange={handleUpload} accept="image/*" multiple />
        </label>
      </div>
      
      {images.length > 0 && (
        <p className="text-[10px] text-neutral-500 italic">
          Az első kép lesz a termék fő képe. Használja a csillag ikont a fő kép kiválasztásához, vagy a nyilakat a sorrend módosításához.
        </p>
      )}

      {isCropping && cropQueue.length > 0 && (
        <ImageCropper
          image={cropQueue[0]}
          aspect={aspect}
          flexibleCrop={flexibleCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  )
}
