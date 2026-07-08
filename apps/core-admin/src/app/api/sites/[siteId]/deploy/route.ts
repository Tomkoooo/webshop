import { NextResponse } from "next/server"
import { dbConnect } from "../../../../../lib/db"
import { Site } from "../../../../../models/Site"
import { requireCoreAdmin } from "../../../../../lib/core-admin-auth"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ siteId: string }> }

/**
 * Dispatches the site's GitHub Actions build workflow (engine bumps,
 * rollbacks) — replaces manual Portainer/image juggling. Requires
 * CORE_ADMIN_GITHUB_TOKEN with `actions:write` on the site repo.
 */
export async function POST(request: Request, ctx: Ctx) {
  const denied = requireCoreAdmin(request)
  if (denied) return denied
  const { siteId } = await ctx.params
  await dbConnect()
  const site = await Site.findOne({ siteId }).lean()
  if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
  if (!site.deployRepo) {
    return NextResponse.json({ ok: false, error: "Site has no deployRepo configured" }, { status: 400 })
  }
  const githubToken = process.env.CORE_ADMIN_GITHUB_TOKEN?.trim()
  if (!githubToken) {
    return NextResponse.json(
      { ok: false, error: "CORE_ADMIN_GITHUB_TOKEN is not configured" },
      { status: 503 }
    )
  }

  const { ref = "main" } = await request.json().catch(() => ({}))
  const workflow = site.deployWorkflow || "docker-publish.yml"
  const response = await fetch(
    `https://api.github.com/repos/${site.deployRepo}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${githubToken}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ref }),
    }
  )
  if (!response.ok) {
    const text = await response.text()
    return NextResponse.json(
      { ok: false, error: `GitHub dispatch failed (${response.status}): ${text}` },
      { status: 502 }
    )
  }
  return NextResponse.json({ ok: true, dispatched: { repo: site.deployRepo, workflow, ref } })
}
