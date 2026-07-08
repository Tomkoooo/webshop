"use client"

import * as React from "react"
import { cn } from "@wse/core/lib/utils"
import { prepareCheckoutRichHtml } from "@wse/core/lib/prepare-checkout-rich-html"

type Props = {
  html?: string | null
  className?: string
}

/** Renders admin-authored HTML on the storefront (product descriptions, etc.). */
export function StorefrontRichHtml({ html, className }: Props) {
  const richHtml = React.useMemo(() => prepareCheckoutRichHtml(html), [html])
  if (!richHtml) return null

  return (
    <div
      className={cn(
        "storefront-rich-html max-w-none leading-relaxed",
        "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4",
        "[&_b]:font-semibold [&_strong]:font-semibold",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-4 [&_ol]:my-4",
        "[&_p]:my-4 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_img]:my-6 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-sm",
        "[&_h1]:font-[family-name:var(--font-display)] [&_h2]:font-[family-name:var(--font-display)] [&_h3]:font-[family-name:var(--font-display)]",
        "[&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_h1]:tracking-tight [&_h2]:tracking-tight [&_h3]:tracking-tight",
        className
      )}
      dangerouslySetInnerHTML={{ __html: richHtml }}
    />
  )
}
