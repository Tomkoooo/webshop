"use client"

import type { ReactNode } from "react"
import { EditableDocLink } from "@wse/core/features/template-cms/primitives/EditableDocLink"
import { cn } from "@wse/core/lib/utils"
import { cmsTokensToClassName, type CmsTokens } from "./tokens"

type CmsLinkProps = {
  /** Base path of a `{ label, href }` pair, e.g. `hero.cta`. */
  path: string
  label: string
  href: string
  tokens?: CmsTokens
  className?: string
  suffix?: ReactNode
}

/** Label + href pair edited together in a floating panel. */
export function CmsLink({ path, label, href, tokens, className, suffix }: CmsLinkProps) {
  return (
    <EditableDocLink
      labelPath={`${path}.label`}
      hrefPath={`${path}.href`}
      label={label}
      href={href}
      className={cn(cmsTokensToClassName(tokens), className)}
      suffix={suffix}
    />
  )
}
