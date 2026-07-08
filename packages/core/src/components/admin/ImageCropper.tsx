"use client"

import { AdminImageCropModal } from "@wse/core/components/admin/AdminImageCropModal"

interface ImageCropperProps {
  image: string
  aspect?: number
  flexibleCrop?: boolean
  onCropComplete: (croppedImage: Blob) => void
  onCancel: () => void
}

export function ImageCropper({
  image,
  aspect = 1,
  flexibleCrop = false,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  return (
    <AdminImageCropModal
      image={image}
      aspect={aspect}
      flexibleCrop={flexibleCrop}
      onCropComplete={onCropComplete}
      onCancel={onCancel}
      title="Kép vágása"
      subtitle="Igazítsa be a termékfotót"
      applyLabel="Alkalmaz"
    />
  )
}
