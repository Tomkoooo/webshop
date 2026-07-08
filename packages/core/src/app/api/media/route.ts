import { NextRequest, NextResponse } from "next/server"
import { MediaService } from "@wse/core/services/media"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = await MediaService.processUpload(buffer, file.name, file.type)

    return NextResponse.json({ filename })
  } catch (error) {
    console.error("[media/upload]", error)
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
