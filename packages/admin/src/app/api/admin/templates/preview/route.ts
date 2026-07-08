import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { isRegisteredTemplateId } from "@wse/core/templates/registry"
import { TEMPLATE_PREVIEW_COOKIE } from "@wse/core/services/template-preview"

const previewBodySchema = z.object({
  templateId: z.string().nullable(),
})

export async function POST(request: Request) {
  await requireAdmin()
  const body = previewBodySchema.parse(await request.json())

  const response = NextResponse.json({ ok: true, previewing: body.templateId })

  if (body.templateId === null) {
    response.cookies.delete(TEMPLATE_PREVIEW_COOKIE)
    return response
  }

  if (!isRegisteredTemplateId(body.templateId)) {
    return NextResponse.json(
      { ok: false, error: `Unknown template id '${body.templateId}'` },
      { status: 400 }
    )
  }

  response.cookies.set({
    name: TEMPLATE_PREVIEW_COOKIE,
    value: body.templateId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  })
  return response
}

export async function DELETE() {
  await requireAdmin()
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(TEMPLATE_PREVIEW_COOKIE)
  return response
}
