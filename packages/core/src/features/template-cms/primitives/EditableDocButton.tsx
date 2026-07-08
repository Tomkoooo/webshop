"use client"

import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { CmsEditableButton } from "./CmsEditableButton"

type EditableDocButtonProps = {
  labelPath: string
  label: string
  className?: string
  type?: "button" | "submit"
  disabled?: boolean
  icon?: React.ReactNode
}

export function EditableDocButton(props: EditableDocButtonProps) {
  const cms = useSurfaceDocEdit()
  return (
    <CmsEditableButton
      enabled={cms.enabled}
      label={props.label}
      onLabelCommit={(value) => cms.setPath(props.labelPath, value)}
      className={props.className}
      type={props.type}
      disabled={props.disabled}
      icon={props.icon}
    />
  )
}
