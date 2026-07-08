import { NextResponse } from "next/server"
import { z } from "zod"
import { dbConnect } from "../../../../lib/db"
import { Site } from "../../../../models/Site"
import { requireCoreAdmin } from "../../../../lib/core-admin-auth"
import { callSiteManagement } from "../../../../lib/site-client"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  templateId: z.string().min(1).optional(),
  plugins: z.array(z.string()).optional(),
  managementSecret: z.string().optional(),
  deployRepo: z.string().optional(),
  deployWorkflow: z.string().optional(),
  notes: z.string().optional(),
})

type Ctx = { params: Promise<{ siteId: string }> }

export async function GET(request: Request, ctx: Ctx) {
  const denied = requireCoreAdmin(request)
  if (denied) return denied
  const { siteId } = await ctx.params
  await dbConnect()
  const site = await Site.findOne({ siteId }).lean()
  if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

  // Live status straight from the deployed site's management surface.
  let live: unknown = null
  if (site.managementSecret) {
    try {
      const result = await callSiteManagement(site, "site")
      live = result.body
    } catch {
      live = { ok: false, error: "Site unreachable" }
    }
  }

  return NextResponse.json({
    ok: true,
    site: {
      siteId: site.siteId,
      label: site.label,
      baseUrl: site.baseUrl,
      templateId: site.templateId,
      plugins: site.plugins,
      engineVersion: site.engineVersion ?? null,
      hasManagementSecret: Boolean(site.managementSecret),
      deployRepo: site.deployRepo ?? null,
      deployWorkflow: site.deployWorkflow ?? null,
      notes: site.notes ?? null,
    },
    live,
  })
}

export async function PUT(request: Request, ctx: Ctx) {
  const denied = requireCoreAdmin(request)
  if (denied) return denied
  const { siteId } = await ctx.params
  const payload = updateSchema.parse(await request.json())
  await dbConnect()
  const site = await Site.findOneAndUpdate({ siteId }, payload, { new: true })
  if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, ctx: Ctx) {
  const denied = requireCoreAdmin(request)
  if (denied) return denied
  const { siteId } = await ctx.params
  await dbConnect()
  await Site.deleteOne({ siteId })
  return NextResponse.json({ ok: true })
}
