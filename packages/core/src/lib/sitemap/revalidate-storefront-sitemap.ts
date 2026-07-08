import { revalidatePath } from "next/cache"

/** Bust cached sitemap after catalog or template changes. */
export function revalidateStorefrontSitemap(): void {
  revalidatePath("/sitemap.xml")
}
