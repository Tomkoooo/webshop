import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireManagementAuth } from "@wse/core/lib/management-auth"
import { TemplateService } from "@wse/core/services/template"
import { ThemeService } from "@wse/core/services/theme"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"

export const dynamic = "force-dynamic"

const hex = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)

const typographySchema = z
  .object({
    fontHeading: z.string().min(1).optional(),
    fontBody: z.string().min(1).optional(),
    weightHeading: z.string().min(1).optional(),
    sizeHero: z.string().min(1).optional(),
    sizeHeading: z.string().min(1).optional(),
    sizeBody: z.string().min(1).optional(),
  })
  .optional()

const themeSchema = z.object({
  typography: typographySchema,
  primary: hex,
  primaryForeground: hex,
  secondary: hex,
  secondaryForeground: hex,
  accent: hex,
  accentForeground: hex,
  background: hex,
  foreground: hex,
  surface: hex,
  surfaceForeground: hex,
  border: hex,
  muted: hex,
  mutedForeground: hex,
  success: hex,
  successForeground: hex,
  warning: hex,
  warningForeground: hex,
  error: hex,
  errorForeground: hex,
})

export async function GET(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  const template = await TemplateService.getDbActive()
  const merged = await ThemeService.getMergedForTemplate(template)
  const typography = await ThemeService.getTypographyForTemplate(template)
  return NextResponse.json({ ...merged, typography })
}

export async function PUT(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  const template = await TemplateService.getDbActive()
  const { typography, ...colors } = themeSchema.parse(await request.json())
  const updated = await ThemeService.saveFullThemeForTemplate(template, colors)
  if (typography) {
    await ThemeService.saveTypographyForTemplate(template, typography)
  }
  revalidatePath("/", "layout")
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.theme)
  return NextResponse.json(updated)
}

export async function DELETE(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  const template = await TemplateService.getDbActive()
  await ThemeService.clearStoredOverrides(template)
  const merged = await ThemeService.getMergedForTemplate(template)
  revalidatePath("/", "layout")
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.theme)
  return NextResponse.json(merged)
}
