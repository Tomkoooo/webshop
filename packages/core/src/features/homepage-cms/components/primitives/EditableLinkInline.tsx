"use client"

import { useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { CmsLinkEditPanel } from "@wse/core/features/template-cms/primitives/CmsLinkEditPanel"
import { useCmsFloatingPanel } from "@wse/core/features/template-cms/primitives/useCmsFloatingPanel"

export function EditableLinkInline({
  blockType,
  blockId,
  labelField,
  hrefField,
  label,
  href,
  className,
  buttonVariant = "default",
  appearance = "button",
  suffix,
  onCommitLabel,
  onCommitHref,
}: {
  blockType: HomepageBlock["type"]
  blockId?: string
  labelField: string
  hrefField: string
  label: string
  href: string
  className?: string
  buttonVariant?: "default" | "outline"
  /** `link` renders a single styled anchor/button surface (for template-native CTAs). */
  appearance?: "button" | "link"
  suffix?: ReactNode
  onCommitLabel?: (value: string) => void
  onCommitHref?: (value: string) => void
}) {
  const cms = useCmsEdit()
  const [open, setOpen] = useState(false)
  const [nextHref, setNextHref] = useState(href || "")
  const [nextLabel, setNextLabel] = useState(label || "")
  const { anchorRef, panelPos } = useCmsFloatingPanel(open)

  const commitLabel = (value: string) => {
    if (onCommitLabel) onCommitLabel(value)
    else cms.updateField(blockType, labelField, value, blockId)
  }

  const commitHref = (value: string) => {
    if (onCommitHref) onCommitHref(value)
    else cms.updateField(blockType, hrefField, value, blockId)
  }

  if (!cms.enabled) {
    if (appearance === "link") {
      return (
        <Link href={href || "#"} className={className}>
          {label}
          {suffix}
        </Link>
      )
    }
    return (
      <Link href={href || "#"} className={className}>
        <Button variant={buttonVariant}>{label}</Button>
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
            onLabelCommit={commitLabel}
            onHrefCommit={commitHref}
            onClose={() => setOpen(false)}
            className={className}
            top={panelPos.top}
            left={panelPos.left}
          />,
          document.body
        )
      : null

  const openEditor = (event: React.MouseEvent) => {
    event.preventDefault()
    if (!open) {
      setNextLabel(label || "")
      setNextHref(href || "")
    }
    setOpen((prev) => !prev)
  }

  return (
    <>
      <div ref={anchorRef} className={cn("relative inline-block", appearance === "link" && className?.includes("w-full") && "w-full")}>
        {appearance === "link" ? (
          <button
            type="button"
            className={cn(
              className,
              "cursor-pointer ring-2 ring-primary/30 ring-offset-2 ring-offset-transparent text-left"
            )}
            onClick={openEditor}
          >
            {label || "Button"}
            {suffix}
          </button>
        ) : (
          <Button
            variant={buttonVariant}
            className={cn(className, "ring-2 ring-primary/30 ring-offset-2 ring-offset-transparent")}
            onClick={openEditor}
          >
            {label || "Button"}
          </Button>
        )}
      </div>
      {panel}
    </>
  )
}
