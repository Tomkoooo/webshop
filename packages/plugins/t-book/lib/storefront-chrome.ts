import type { ChromeNavCta, ChromeNavItem } from "@wse/sdk/templates/types"
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

export const defaultNavCta: ChromeNavCta = {
  enabled: true,
  label: "Jegyek",
  mobileLabel: "Jegyek & foglalás",
  href: "/jegyek",
  showIcon: true,
}

const navCtaSchema = z.object({
  enabled: z.boolean().default(true),
  label: z.string().default(defaultNavCta.label),
  mobileLabel: z.string().default(defaultNavCta.mobileLabel),
  href: z.string().default(defaultNavCta.href),
  showIcon: z.boolean().default(true),
})

export const tBookHomeChromeSchema = z.object({
  nav: z.array(navItemSchema).default([]),
  navCta: navCtaSchema.default(defaultNavCta),
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
    : { nav: [], navCta: defaultNavCta, tbookApiKey: "" }
}

export function navItemsFromTBookChrome(config: TBookHomeChromeConfig): ChromeNavItem[] {
  return config.nav.map((item) =>
    item.type === "link"
      ? { type: "link" as const, label: item.label, href: item.href }
      : { type: "dropdown" as const, label: item.label, items: item.items }
  )
}

export function navCtaFromTBookChrome(config: TBookHomeChromeConfig): ChromeNavCta {
  return { ...defaultNavCta, ...config.navCta }
}
