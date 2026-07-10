import type { ChromeNavItem } from "@wse/sdk/templates/types"
import { z } from "zod"
import { normalizeTBookApiKey } from "./api-key"

const navLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
})

const navItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("link"), label: z.string(), href: z.string() }),
  z.object({
    type: z.literal("dropdown"),
    label: z.string(),
    items: z.array(navLinkSchema).default([]),
  }),
])

export const tBookHomeChromeSchema = z.object({
  nav: z.array(navItemSchema).default([]),
  tbookApiKey: z.string().default(""),
})

export type TBookHomeChromeConfig = z.infer<typeof tBookHomeChromeSchema>

export function extractTBookHomeChrome(content: unknown): TBookHomeChromeConfig {
  const parsed = tBookHomeChromeSchema.safeParse(
    typeof content === "object" && content !== null && "chrome" in content
      ? (content as { chrome: unknown }).chrome
      : {}
  )
  return parsed.success
    ? { ...parsed.data, tbookApiKey: normalizeTBookApiKey(parsed.data.tbookApiKey) }
    : { nav: [], tbookApiKey: "" }
}

export function navItemsFromTBookChrome(config: TBookHomeChromeConfig): ChromeNavItem[] {
  return config.nav.map((item) =>
    item.type === "link"
      ? { type: "link" as const, label: item.label, href: item.href }
      : { type: "dropdown" as const, label: item.label, items: item.items }
  )
}
