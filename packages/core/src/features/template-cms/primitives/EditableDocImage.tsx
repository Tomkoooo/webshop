"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { MediaFillFrame } from "@wse/core/components/common/MediaFillFrame"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

type Props = {
  path: string
  src: string
  alt?: string
  className?: string
  imageClassName?: string
  frameClassName?: string
  fill?: boolean
  width?: number
  height?: number
  flexibleCrop?: boolean
  usageLabel?: string
}

export function EditableDocImage({
  path,
  src,
  alt = "",
  className,
  imageClassName,
  frameClassName,
  fill = false,
  width = 1200,
  height = 800,
  flexibleCrop = true,
  usageLabel,
}: Props) {
  const cms = useSurfaceDocEdit()
  const resolved = mediaImageSrc(src)
  const useFill = fill || Boolean(frameClassName)
  const [panelOpen, setPanelOpen] = useState(false)

  const imageNode = useFill ? (
    <FallbackImage
      src={resolved}
      alt={alt}
      fill
      className={cn("object-cover", imageClassName)}
      showFallbackOnError={cms.enabled ? false : undefined}
    />
  ) : (
    <FallbackImage
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={imageClassName}
      showFallbackOnError={cms.enabled ? false : undefined}
    />
  )

  const framedImage = useFill ? (
    <MediaFillFrame
      className={frameClassName ?? "w-full"}
      aspectRatio={frameClassName ? undefined : width / height}
    >
      {imageNode}
    </MediaFillFrame>
  ) : (
    imageNode
  )

  if (!cms.enabled) {
    return <div className={className}>{framedImage}</div>
  }

  return (
    <div
      className={cn(
        "group relative",
        className,
        // When the upload panel is open, lift above sibling overlays (e.g. hero copy).
        panelOpen && "z-30"
      )}
    >
      <div
        className={cn(
          "relative",
          panelOpen && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
        )}
      >
        {framedImage}
        {/*
          Fill/hero images often sit under a z-10 content layer at the bottom.
          Anchor controls at the top so they stay visible and clickable.
        */}
        <div
          className={cn(
            "cms-admin-control pointer-events-auto absolute inset-x-2 z-30 flex justify-end transition-opacity",
            useFill ? "top-2 opacity-100" : "bottom-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          )}
        >
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 shadow-md"
            onClick={() => setPanelOpen((open) => !open)}
          >
            <ImageIcon className="size-3.5" />
            {panelOpen ? "Bezárás" : "Kép szerkesztése"}
          </Button>
        </div>
      </div>

      {panelOpen ? (
        <div className="cms-admin-control pointer-events-auto relative z-40 mt-2 space-y-2 rounded-lg bg-card p-3 shadow-sm ring-1 ring-border/60">
          {usageLabel ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{usageLabel}</span>
              {` · javasolt ${width}×${height}px`}
            </p>
          ) : null}
          <UploadSheet
            onUploaded={(next) => {
              cms.setPath(path, next)
              setPanelOpen(false)
            }}
            label="Kép feltöltése"
            usageLabel={usageLabel}
            recommendedSize={{ width, height }}
            aspect={width / height}
            allowRectangleCrop={flexibleCrop}
            allowSkipCrop={flexibleCrop}
          />
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Kép URL</Label>
            <Input
              value={src}
              onChange={(event) => cms.setPath(path, event.target.value)}
              placeholder="/api/media/..."
              className="h-8 text-xs"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
