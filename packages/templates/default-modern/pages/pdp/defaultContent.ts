import { pdpSchema, type PdpContent } from "./schema"

export const pdpDefaultContent: PdpContent = pdpSchema.parse({})
