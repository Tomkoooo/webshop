"use client"

import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"

type Props = {
  src: string
  alt: string
  editMode: boolean
  onChange: (nextSrc: string) => void
  className?: string
  width?: number
  height?: number
  usageLabel?: string
  /** Enables free rectangle crop and full-image upload in the editor (for banners and logos). */
  flexibleCrop?: boolean
  /** Renders upload controls below the preview so parent overflow-hidden does not clip them. */
  separateControls?: boolean
}

function EditableImageControls({
  src,
  onChange,
  width,
  height,
  usageLabel,
  flexibleCrop,
}: Pick<Props, "src" | "onChange" | "width" | "height" | "usageLabel" | "flexibleCrop">) {
  return (
    <div className="cms-admin-control relative z-10 space-y-2">
      <UploadSheet
        onUploaded={onChange}
        label="Upload image"
        usageLabel={usageLabel}
        recommendedSize={{ width: width ?? 1200, height: height ?? 800 }}
        aspect={(width ?? 1200) / (height ?? 800)}
        allowRectangleCrop={flexibleCrop}
        allowSkipCrop={flexibleCrop}
      />
      <input
        value={src}
        onChange={(event) => onChange(event.target.value)}
        placeholder="/api/media/..."
        className="w-full border border-dashed border-white/20 bg-transparent px-2 py-1 text-xs text-white focus:border-primary-foreground/50 focus:outline-none"
      />
    </div>
  )
}

export function EditableImage({
  src,
  alt,
  editMode,
  onChange,
  className,
  width = 1200,
  height = 800,
  usageLabel,
  flexibleCrop = false,
  separateControls = false,
}: Props) {
  if (editMode && separateControls) {
    return (
      <div className="flex flex-col gap-2">
        <FallbackImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          showFallbackOnError={false}
        />
        <EditableImageControls
          src={src}
          onChange={onChange}
          width={width}
          height={height}
          usageLabel={usageLabel}
          flexibleCrop={flexibleCrop}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <FallbackImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        showFallbackOnError={editMode ? false : true}
      />
      {editMode ? (
        <EditableImageControls
          src={src}
          onChange={onChange}
          width={width}
          height={height}
          usageLabel={usageLabel}
          flexibleCrop={flexibleCrop}
        />
      ) : null}
    </div>
  )
}
