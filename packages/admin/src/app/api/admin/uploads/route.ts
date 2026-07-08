import { NextResponse } from "next/server"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { MediaService } from "@wse/core/services/media"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 })
    }
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = await MediaService.processUpload(buffer, file.name, file.type)
    await MediaService.incrementUsage(filename)
    return NextResponse.json({ url: `/api/media/${filename}`, mediaId: filename })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    console.error("[admin/uploads]", error)
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
