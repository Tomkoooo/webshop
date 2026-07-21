import { useState } from "react"
import { Upload, X } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { ImageCropper } from "./ImageCropper"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { preferredCropOutput } from "@wse/core/lib/crop-utils"

interface ImageUploadProps {
  onUpload: (filename: string) => void
  currentImage?: string
  aspect?: number
  flexibleCrop?: boolean
}

function isSvgFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return file.type === "image/svg+xml" || name.endsWith(".svg")
}

export function ImageUpload({
  onUpload,
  currentImage,
  aspect = 1,
  flexibleCrop = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const uploadFile = async (file: Blob, filename: string) => {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file, filename)

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.filename) {
        onUpload(data.filename)
        setPreview(data.filename)
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // SVGs must stay vector — the cropper rasterizes to JPEG and looks pixelated on listings.
    if (isSvgFile(file)) {
      void uploadFile(file, file.name)
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFile(reader.result as string)
      setIsCropping(true)
    }
    reader.readAsDataURL(file)

    // Clear the input value so the same file can be selected again if needed
    e.target.value = ""
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropping(false)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(croppedBlob)

    const filename =
      croppedBlob.type === "image/png"
        ? "edited-image.png"
        : croppedBlob.type === "image/jpeg"
          ? "edited-image.jpg"
          : preferredCropOutput(selectedFile ?? "").filename
    await uploadFile(croppedBlob, filename)
  }

  return (
    <div className="space-y-4">
      <div className="relative group aspect-square w-full max-w-[240px] overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60 flex items-center justify-center transition-all hover:ring-primary/40">
        {preview ? (
          <>
            <FallbackImage
              src={mediaImageSrc(preview)}
              alt="Preview"
              width={240}
              height={240}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setPreview("")
                onUpload("")
              }}
              className="absolute top-2 right-2 p-1.5 bg-background/60 backdrop-blur-md rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium text-muted-foreground line-clamp-1">Kép feltöltése</p>
            <input type="file" className="hidden" onChange={onFileSelect} accept="image/*,.svg" />
          </label>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>

      {isCropping && selectedFile && (
        <ImageCropper
          image={selectedFile}
          aspect={aspect}
          flexibleCrop={flexibleCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropping(false)}
        />
      )}
    </div>
  )
}
