import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import dbConnect from "@wse/core/lib/db"
import Product from "@wse/core/models/Product"
import {
  getCartLineOrderabilityMessage,
  type ProductForCartOrderability,
} from "@wse/core/lib/cart-line-orderability"
import {
  getStaleLimitedPriceCartMessage,
  quoteCheckoutLineForQuantity,
} from "@wse/core/lib/limited-price-checkout"
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop"

const lineSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  name: z.string().optional(),
  price: z.number().finite().optional(),
})

const bodySchema = z.object({
  items: z.array(lineSchema).max(100),
})

export async function POST(req: NextRequest) {
  const blocked = shopCommerceBlockedResponse()
  if (blocked) return blocked

  try {
    const { items } = bodySchema.parse(await req.json())
    if (items.length === 0) {
      return NextResponse.json({ issues: {} as Record<string, string> })
    }

    const productIds = [
      ...new Set(
        items
          .map((line) => line.productId)
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
      ),
    ]

    await dbConnect()
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } })
          .select(
            "name isActive isVisible stock requireVariantSelection variants netPrice grossPrice discount vatPercent limitedPrice uniqueNumberedVariants"
          )
          .lean()
      : []

    const productById = new Map(
      products.map((product) => [String(product._id), product])
    )

    const issues: Record<string, string> = {}
    for (const line of items) {
      if (!mongoose.Types.ObjectId.isValid(line.productId)) {
        issues[line.id] = "Érvénytelen termék a kosárban."
        continue
      }
      const message = getCartLineOrderabilityMessage(
        {
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          name: line.name,
        },
        productById.get(line.productId) as ProductForCartOrderability | undefined
      )
      if (message) {
        issues[line.id] = message
        continue
      }

      const quote = quoteCheckoutLineForQuantity(
        productById.get(line.productId) as Parameters<typeof quoteCheckoutLineForQuantity>[0],
        line.variantId,
        line.quantity
      )
      const stalePriceMessage = getStaleLimitedPriceCartMessage(line.price, line.quantity, quote)
      if (stalePriceMessage) issues[line.id] = stalePriceMessage
    }

    return NextResponse.json({ issues })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Érvénytelen kérés" }, { status: 400 })
    }
    console.error("Cart validate error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
