"use client"

import { EditableDocImage } from "@wse/core/features/template-cms/primitives/EditableDocImage"

type CmsImageProps = {
  path: string
  src: string
  alt?: string
  className?: string
  imageClassName?: string
  frameClassName?: string
  fill?: boolean
  width?: number
  height?: number
  usageLabel?: string
}

/** Image field with upload + URL editing in the visual CMS. */
export function CmsImage(props: CmsImageProps) {
  return <EditableDocImage {...props} />
}
