import type { ContactEmailEntry } from "@wse/core/lib/contact-emails"
import { resolveSiteContactChannels } from "@wse/core/lib/site-contact"
import { CategoryService } from "@wse/core/services/category"
import { ShopContentService } from "@wse/core/services/shop-content"
import { PageContentService } from "@wse/core/services/page-content"
import type { TemplateModule } from "@wse/sdk/templates/types"

export type ShopContentSnapshot = Awaited<ReturnType<typeof ShopContentService.getAll>>

export type CategoryTreeNode = {
  _id: unknown
  name: string
  slug: string
  children?: unknown[]
}

export type ResolveStorefrontFooterOptions = {
  /** When provided (e.g. homepage), avoids an extra `page:home` read for default-modern contact block. */
  homepageContent?: unknown
  /** When already loaded (e.g. shop page), avoids a second `ShopContentService.getAll()`. */
  shopContentSnapshot?: ShopContentSnapshot
  /** When already loaded, avoids a second `CategoryService.getTree()`. */
  categoryTreeSnapshot?: CategoryTreeNode[]
}

export type FooterCategoryItem = {
  id: string
  name: string
  slug: string
  depth: number
}

export function flattenCategoryTreeForFooter(
  nodes: Array<{ _id: unknown; name: string; slug: string; children?: unknown[] }>,
  depth = 0
): FooterCategoryItem[] {
  return nodes.flatMap((node) => {
    const current: FooterCategoryItem = {
      id: String(node._id),
      name: node.name,
      slug: node.slug,
      depth,
    }
    const children = Array.isArray(node.children)
      ? flattenCategoryTreeForFooter(
          node.children as Array<{
            _id: unknown
            name: string
            slug: string
            children?: unknown[]
          }>,
          depth + 1
        )
      : []
    return [current, ...children]
  })
}

type PublishedContact = { phone?: string; address?: string }

/**
 * Footer categories + contact lines for storefront routes (homepage, static pages, cart, etc.).
 */
export async function resolveStorefrontFooterContact(
  template: TemplateModule,
  options?: ResolveStorefrontFooterOptions
): Promise<{
  categories: FooterCategoryItem[]
  email: string
  contactEmails: ContactEmailEntry[]
  phone: string
  address: string
}> {
  const [categoryTree, shopContent] = await Promise.all([
    options?.categoryTreeSnapshot !== undefined
      ? Promise.resolve(options.categoryTreeSnapshot)
      : CategoryService.getTree(),
    options?.shopContentSnapshot !== undefined
      ? Promise.resolve(options.shopContentSnapshot)
      : ShopContentService.getAll(),
  ])

  const categories = flattenCategoryTreeForFooter(categoryTree as CategoryTreeNode[])

  let publishedContact: PublishedContact = {}

  if (template.manifest.id === "default-modern") {
    type HomePublished = {
      blocks?: Array<{ type: string; enabled?: boolean; data?: PublishedContact }>
    }
    let content: HomePublished | undefined
    if (options?.homepageContent !== undefined) {
      content = options.homepageContent as HomePublished
    } else {
      const homePageDef = template.pages.home
      const raw = await PageContentService.get(template.manifest.id, "page:home").catch(
        () => homePageDef.defaultContent
      )
      content = raw as HomePublished
    }
    const blocks = content?.blocks
    if (Array.isArray(blocks)) {
      const block = blocks.find((b) => b.type === "contact" && b.enabled !== false)
      publishedContact = (block?.data ?? {}) as PublishedContact
    }
  }

  const channels = resolveSiteContactChannels(shopContent, {
    phone: publishedContact.phone,
    address: publishedContact.address,
  })

  return {
    categories,
    contactEmails: channels.emails,
    email: channels.emailsDisplay,
    phone: channels.phone,
    address: channels.address,
  }
}
