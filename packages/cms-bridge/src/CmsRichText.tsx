"use client"

import { EditableDocRichText } from "@wse/core/features/template-cms/primitives/EditableDocRichText"
import { cn } from "@wse/core/lib/utils"
import { cmsTokensToClassName, type CmsTokens } from "./tokens"

type CmsRichTextProps = {
  path: string
  html: string
  tokens?: CmsTokens
  className?: string
  toolbar?: "full" | "compact" | "none"
}

/** TipTap-backed rich text field. */
export function CmsRichText({ path, html, tokens, className, toolbar }: CmsRichTextProps) {
  return (
    <EditableDocRichText
      path={path}
      html={html}
      toolbar={toolbar}
      className={cn(cmsTokensToClassName(tokens), className)}
    />
  )
}
