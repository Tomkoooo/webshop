"use client"

import * as React from "react"
import { cn } from "@wse/core/lib/utils"
import { prepareCheckoutRichHtml } from "@wse/core/lib/prepare-checkout-rich-html"
import type { CheckoutStepAppearance } from "@wse/core/components/checkout/checkout-appearance"

type Props = {
  html?: string | null
  appearance?: CheckoutStepAppearance
  className?: string
}

/** Renders admin- or provider-authored HTML in checkout via dangerouslySetInnerHTML. */
export function CheckoutRichHtml({ html, appearance = "dark", className }: Props) {
  const richHtml = React.useMemo(() => prepareCheckoutRichHtml(html), [html])
  if (!richHtml) return null

  return (
    <div
      className={cn(
        "checkout-rich-html max-w-none leading-relaxed normal-case",
        "[&_a]:underline [&_b]:font-semibold [&_strong]:font-semibold",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4 [&_ul]:my-2 [&_ol]:my-2",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        appearance === "light"
          ? "text-sm text-muted-foreground [&_a]:text-primary"
          : "text-sm text-neutral-300 [&_a]:text-primary-foreground",
        className
      )}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: richHtml }}
    />
  )
}
