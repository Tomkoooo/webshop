"use client"

import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { Input } from "@wse/core/components/ui/input"
import { adminInputClass } from "@wse/core/lib/admin-ui"

type Props = {
  src: string
  alt: string
  editMode: boolean
  onChange: (nextSrc: string) => void
  className?: string
  width?: number
  height?: number
  usageLabel?: string
  flexibleCrop?: boolean
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
        label="Kép feltöltése"
        usageLabel={usageLabel}
        recommendedSize={{ width: width ?? 1200, height: height ?? 800 }}
        aspect={(width ?? 1200) / (height ?? 800)}
        allowRectangleCrop={flexibleCrop}
        allowSkipCrop={flexibleCrop}
      />
      <Input
        value={src}
        onChange={(event) => onChange(event.target.value)}
        placeholder="/api/media/..."
        className={`${adminInputClass} h-8 text-xs`}
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
