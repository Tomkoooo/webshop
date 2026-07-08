"use client"

import { EditableDocRichText } from "@wse/core/features/template-cms/primitives/EditableDocRichText"
import { cn } from "@wse/core/lib/utils"
import { cmsTokensToClassName, type CmsTokens } from "./tokens"

type CmsRichTextProps = {
  path: string
  html: string
  tokens?: CmsTokens
  className?: string
}

/** TipTap-backed rich text field. */
export function CmsRichText({ path, html, tokens, className }: CmsRichTextProps) {
  return (
    <EditableDocRichText
      path={path}
      html={html}
      className={cn(cmsTokensToClassName(tokens), className)}
    />
  )
}
