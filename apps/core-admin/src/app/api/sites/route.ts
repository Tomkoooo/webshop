import { NextResponse } from "next/server"
import { z } from "zod"
import { dbConnect } from "../../../lib/db"
import { Site } from "../../../models/Site"
import { requireCoreAdmin } from "../../../lib/core-admin-auth"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  siteId: z.string().min(1).regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  baseUrl: z.string().url(),
  templateId: z.string().min(1),
  plugins: z.array(z.string()).default([]),
  managementSecret: z.string().optional(),
  deployRepo: z.string().optional(),
  deployWorkflow: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  const denied = requireCoreAdmin(request)
  if (denied) return denied
  await dbConnect()
  const sites = await Site.find().sort({ siteId: 1 }).lean()
  return NextResponse.json({
    ok: true,
    sites: sites.map((s) => ({
      siteId: s.siteId,
      label: s.label,
      baseUrl: s.baseUrl,
      templateId: s.templateId,
      plugins: s.plugins,
      engineVersion: s.engineVersion ?? null,
      hasManagementSecret: Boolean(s.managementSecret),
      deployRepo: s.deployRepo ?? null,
    })),
  })
}

export async function POST(request: Request) {
  const denied = requireCoreAdmin(request)
  if (denied) return denied
  const payload = createSchema.parse(await request.json())
  await dbConnect()
  const existing = await Site.findOne({ siteId: payload.siteId })
  if (existing) {
    return NextResponse.json({ ok: false, error: "siteId already registered" }, { status: 409 })
  }
  await Site.create(payload)
  return NextResponse.json({ ok: true })
}
