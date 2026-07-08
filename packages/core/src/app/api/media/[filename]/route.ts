import { NextRequest, NextResponse } from "next/server"
import { getMediaFilePayload } from "@wse/core/lib/media-get-file"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const payload = await getMediaFilePayload(filename)

  if (!payload) {
    return new NextResponse("File not found", { status: 404 })
  }

  const headers = {
    "Content-Type": payload.mimeType,
    "Content-Length": String(payload.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: payload.etag,
    ...(payload.lastModified ? { "Last-Modified": payload.lastModified.toUTCString() } : {}),
  }

  if (request.headers.get("if-none-match") === payload.etag) {
    return new NextResponse(null, {
      status: 304,
      headers,
    })
  }

  return new NextResponse(new Uint8Array(payload.buffer), {
    headers,
  })
}
