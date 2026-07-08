"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Upload, X } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import type { GalleryBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { mediaImageSrc } from "@wse/core/lib/images"

type Props = {
  block: GalleryBlock
  onPatch: (field: keyof GalleryBlock["data"], value: unknown) => void
}

export function GalleryBlockEditor({ block, onPatch }: Props) {
  const [uploading, setUploading] = useState(false)
  const items = Array.isArray(block.data.items) ? block.data.items : []
  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const uploadedItems: GalleryBlock["data"]["items"] = []
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file, file.name)
        const response = await fetch("/api/admin/uploads", { method: "POST", body: formData })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.url) {
          throw new Error(typeof data.error === "string" ? data.error : "Image upload failed")
        }
        uploadedItems.push({ image: data.url, caption: "" })
      }
      onPatch("items", [...items, ...uploadedItems])
    } catch (error) {
      console.error("[gallery upload]", error)
      window.alert(error instanceof Error ? error.message : "Image upload failed")
    } finally {
      setUploading(false)
    }
  }

  const moveItem = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= items.length) return
    const nextItems = [...items]
    const current = nextItems[index]
    nextItems[index] = nextItems[nextIndex]!
    nextItems[nextIndex] = current!
    onPatch("items", nextItems)
  }

  return (
    <section className="py-20 border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 space-y-4">
        <EditableHeading value={block.data.title} onChange={(value) => onPatch("title", value)} editMode className="text-3xl text-white font-black" />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 border border-white/20 px-3 text-xs uppercase text-white hover:border-primary-foreground/40">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload images"}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(event) => {
                void uploadFiles(event.target.files)
                event.target.value = ""
              }}
            />
          </label>
          <p className="text-xs text-neutral-500">Images keep their original ratios in the storefront gallery.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div key={`gallery-item-${index}`} className="space-y-3 border border-white/10 p-3">
              <FallbackImage
                src={mediaImageSrc(item.image)}
                alt={item.caption || `Gallery image ${index + 1}`}
                width={640}
                height={480}
                className="h-56 w-full object-contain bg-black/30"
                showFallbackOnError={false}
              />
              <input
                value={item.caption}
                onChange={(event) =>
                  onPatch(
                    "items",
                    items.map((current, idx) => (idx === index ? { ...current, caption: event.target.value } : current))
                  )
                }
                className="h-9 w-full bg-black border border-white/20 px-2 text-sm text-white"
                placeholder="Caption / alt text"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="xs" variant="outline" disabled={index === 0} onClick={() => moveItem(index, -1)}>
                  <ArrowUp className="h-3 w-3" />
                  Up
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <ArrowDown className="h-3 w-3" />
                  Down
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  className="ml-auto"
                  onClick={() => onPatch("items", items.filter((_, idx) => idx !== index))}
                >
                  <X className="h-3 w-3" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center border border-dashed border-white/20 p-6 text-center text-sm text-neutral-500">
            Upload images to build the gallery.
          </div>
        ) : null}
      </div>
    </section>
  )
}
