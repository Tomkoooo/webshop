"use client"

import type { ElementType } from "react"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { cn } from "@wse/core/lib/utils"
import { cmsTokensToClassName, type CmsTokens } from "./tokens"

type CmsTextProps = {
  /** Content path in the page document, e.g. `hero.title` or `features.2.label`. */
  path: string
  value: string
  /** Wrapping element; defaults to a plain span (inline). */
  as?: ElementType
  tokens?: CmsTokens
  className?: string
  multiline?: boolean
  placeholder?: string
}

/** Unified string field: inline edit in the visual CMS, plain text otherwise. */
export function CmsText({
  path,
  value,
  as,
  tokens,
  className,
  multiline = false,
  placeholder,
}: CmsTextProps) {
  const Tag = (as ?? "span") as ElementType
  const tokenClasses = cmsTokensToClassName(tokens)
  const inner = (
    <EditableDocText path={path} value={value} multiline={multiline} placeholder={placeholder} />
  )
  if (!as && !tokenClasses && !className) return inner
  return <Tag className={cn(tokenClasses, className)}>{inner}</Tag>
}
