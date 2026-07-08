"use client"

import { useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { cn } from "@wse/core/lib/utils"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { CmsLinkEditPanel } from "./CmsLinkEditPanel"
import { useCmsFloatingPanel } from "./useCmsFloatingPanel"

type EditableDocLinkProps = {
  labelPath: string
  hrefPath: string
  label: string
  href: string
  className?: string
  suffix?: ReactNode
}

export function EditableDocLink({
  labelPath,
  hrefPath,
  label,
  href,
  className,
  suffix,
}: EditableDocLinkProps) {
  const cms = useSurfaceDocEdit()
  const [open, setOpen] = useState(false)
  const [nextLabel, setNextLabel] = useState(label || "")
  const [nextHref, setNextHref] = useState(href || "")
  const { anchorRef, panelPos } = useCmsFloatingPanel(open)

  if (!cms.enabled) {
    return (
      <Link href={href || "#"} className={className}>
        {label}
        {suffix}
      </Link>
    )
  }

  const panel =
    open && panelPos
      ? createPortal(
          <CmsLinkEditPanel
            label={nextLabel}
            href={nextHref}
            onLabelChange={setNextLabel}
            onHrefChange={setNextHref}
            onLabelCommit={(value) => cms.setPath(labelPath, value)}
            onHrefCommit={(value) => cms.setPath(hrefPath, value)}
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
      <div ref={anchorRef} className="relative inline-block">
        <button
          type="button"
          className={cn(
            className,
            "cursor-pointer ring-2 ring-primary/30 ring-offset-2 ring-offset-transparent"
          )}
          onClick={(event) => {
            event.preventDefault()
            if (!open) {
              setNextLabel(label || "")
              setNextHref(href || "")
            }
            setOpen((prev) => !prev)
          }}
        >
          {label || "Button"}
          {suffix}
        </button>
      </div>
      {panel}
    </>
  )
}
