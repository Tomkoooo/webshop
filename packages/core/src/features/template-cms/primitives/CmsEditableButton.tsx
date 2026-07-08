"use client"

import { useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@wse/core/lib/utils"
import { CmsLinkEditPanel } from "./CmsLinkEditPanel"
import { useCmsFloatingPanel } from "./useCmsFloatingPanel"

type CmsEditableButtonProps = {
  enabled: boolean
  label: string
  onLabelCommit: (value: string) => void
  className?: string
  type?: "button" | "submit"
  disabled?: boolean
  icon?: ReactNode
}

export function CmsEditableButton({
  enabled,
  label,
  onLabelCommit,
  className,
  type = "button",
  disabled = false,
  icon,
}: CmsEditableButtonProps) {
  const [open, setOpen] = useState(false)
  const [nextLabel, setNextLabel] = useState(label || "")
  const { anchorRef, panelPos } = useCmsFloatingPanel(open)

  if (!enabled) {
    return (
      <button type={type} disabled={disabled} className={className}>
        {icon}
        {label}
      </button>
    )
  }

  const panel =
    open && panelPos
      ? createPortal(
          <CmsLinkEditPanel
            title="Button"
            label={nextLabel}
            href=""
            showHref={false}
            onLabelChange={setNextLabel}
            onHrefChange={() => {}}
            onLabelCommit={(value) => onLabelCommit(value)}
            onHrefCommit={() => {}}
            onClose={() => setOpen(false)}
            className={className}
            top={panelPos.top}
            left={panelPos.left}
          />,
          document.body
        )
      : null

  return (
    <>
      <div ref={anchorRef} className="relative inline-block w-full">
        <button
          type={type}
          disabled={disabled}
          className={cn(
            className,
            "cursor-pointer ring-2 ring-primary/30 ring-offset-2 ring-offset-transparent"
          )}
          onClick={(event) => {
            event.preventDefault()
            if (!open) setNextLabel(label || "")
            setOpen((prev) => !prev)
          }}
        >
          {icon}
          {label || "Button"}
        </button>
      </div>
      {panel}
    </>
  )
}
