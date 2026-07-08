import { NextResponse } from "next/server"
import { dbConnect } from "../../../../../../lib/db"
import { Site } from "../../../../../../models/Site"
import { requireCoreAdmin } from "../../../../../../lib/core-admin-auth"
import {
  callSiteManagement,
  MANAGEMENT_RESOURCES,
  type ManagementResource,
} from "../../../../../../lib/site-client"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ siteId: string; resource: string }> }

/** Proxies GET/PUT/POST/DELETE to a site's /api/management/<resource>. */
async function proxy(request: Request, ctx: Ctx, method: string) {
  const denied = requireCoreAdmin(request)
  if (denied) return denied
  const { siteId, resource } = await ctx.params
  if (!MANAGEMENT_RESOURCES.includes(resource as ManagementResource)) {
    return NextResponse.json({ ok: false, error: `Unknown resource '${resource}'` }, { status: 400 })
  }
  await dbConnect()
  const site = await Site.findOne({ siteId }).lean()
  if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

  const url = new URL(request.url)
  const query = Object.fromEntries(url.searchParams.entries())
  const body = method === "GET" || method === "DELETE" ? undefined : await request.json()
  try {
    const result = await callSiteManagement(site, resource as ManagementResource, {
      method,
      body,
      query,
    })
    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ ok: false, error: "Site unreachable" }, { status: 502 })
  }
}

export async function GET(request: Request, ctx: Ctx) {
  return proxy(request, ctx, "GET")
}

export async function PUT(request: Request, ctx: Ctx) {
  return proxy(request, ctx, "PUT")
}

export async function POST(request: Request, ctx: Ctx) {
  return proxy(request, ctx, "POST")
}

export async function DELETE(request: Request, ctx: Ctx) {
  return proxy(request, ctx, "DELETE")
}
