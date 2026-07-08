import { shopSchema, type ShopContent } from "./schema"

export const shopDefaultContent: ShopContent = shopSchema.parse({})
