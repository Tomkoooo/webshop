"use server"

import { revalidatePath } from "next/cache"
import { ShopContentService } from "@wse/core/services/shop-content"
import { auth } from "@wse/core/auth"

export async function updateShopContent(formData: FormData) {
  const session = await auth()
  
  // @ts-ignore
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const entries = Array.from(formData.entries())
  const items = entries
    .filter(([key]) => !key.startsWith("$")) // Filter out internal Next.js fields
    .map(([key, value]) => ({
      key,
      value: value as string,
      section: key.split("_")[0], // Simple section mapping
    }))

  await ShopContentService.updateMany(items)
  
  revalidatePath("/")
  revalidatePath("/shop")
  revalidatePath("/admin/cms")
}
