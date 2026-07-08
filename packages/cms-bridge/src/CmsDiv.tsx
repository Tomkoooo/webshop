"use client"

import type { ElementType, ReactNode } from "react"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { cn } from "@wse/core/lib/utils"
import { cmsTokensToClassName, type CmsTokens } from "./tokens"

type CmsDivProps = {
  /** Optional content path for canvas highlighting / sidebar sync. */
  path?: string
  as?: ElementType
  tokens?: CmsTokens
  className?: string
  children?: ReactNode
}

/**
 * Ruled container: styling comes from token roles instead of raw color classes.
 * In the visual CMS it exposes its path for hover-highlighting and selection.
 */
export function CmsDiv({ path, as, tokens, className, children }: CmsDivProps) {
  const cms = useSurfaceDocEdit()
  const Tag = (as ?? "div") as ElementType
  return (
    <Tag
      className={cn(cmsTokensToClassName(tokens), className)}
      data-cms-path={cms.enabled && path ? path : undefined}
    >
      {children}
    </Tag>
  )
}
