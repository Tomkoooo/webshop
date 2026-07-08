import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import dbConnect from "@wse/core/lib/db"
import Product from "@wse/core/models/Product"
import { mediaImageSrc } from "@wse/core/lib/images"

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).max(100),
})

/**
 * Admin-only: resolve product ids to display labels (name, slug, thumb) for pickers and CMS.
 */
export async function POST(request: Request) {
  await requireAdmin()

  const json = await request.json().catch(() => ({}))
  const { ids } = bodySchema.parse(json)

  const uniqueOrdered: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    uniqueOrdered.push(id)
  }

  const validIds = uniqueOrdered.filter((id) => mongoose.isValidObjectId(id))
  if (validIds.length === 0) {
    return NextResponse.json({ items: [] as { id: string; name: string; slug: string; image: string }[] })
  }

  await dbConnect()
  const objectIds = validIds.map((id) => new mongoose.Types.ObjectId(id))
  const docs = await Product.find({ _id: { $in: objectIds } })
    .select("name slug images")
    .lean()

  const byId = new Map(docs.map((p: any) => [p._id.toString(), p]))

  const items = uniqueOrdered
    .map((id) => {
      if (!mongoose.isValidObjectId(id)) return null
      const p = byId.get(id) as { name?: string; slug?: string; images?: string[] } | undefined
      if (!p) return null
      return {
        id,
        name: p.name ?? "Termék",
        slug: p.slug ?? "",
        image: mediaImageSrc(p.images?.[0]),
      }
    })
    .filter((x): x is { id: string; name: string; slug: string; image: string } => x !== null)

  return NextResponse.json({ items })
}
