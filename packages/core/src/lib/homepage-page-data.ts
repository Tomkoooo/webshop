import { timeAsync } from "@wse/core/lib/dev-timing"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import {
  getHomepageRenderDependencies,
  type HomepageFeaturedResolveOptions,
} from "@wse/core/features/homepage-cms/render/homepage-deps"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import {
  resolveStorefrontFooterContact,
  type FooterCategoryItem,
} from "@wse/core/lib/storefront-footer-data"
import { getRequestPageContent } from "@wse/core/lib/cached-storefront"
import type { HomepageDepsInternal } from "@wse/core/features/homepage-cms/render/homepage-deps"
import type { ActiveChrome } from "@wse/core/lib/active-chrome"

export type HomepagePageData = {
  chrome: ActiveChrome
  content: HomepageSnapshot
  dependencies: Omit<HomepageDepsInternal, "shopContentSnapshot" | "categoryTreeSnapshot"> & {
    templateId: string
  }
  footerData: {
    categories: FooterCategoryItem[]
    email: string
    contactEmails: import("@wse/core/lib/contact-emails").ContactEmailEntry[]
    phone: string
    address: string
  }
}

export async function getHomepagePageData(): Promise<HomepagePageData> {
  const chrome = await timeAsync("homepage.getActiveChrome", () => getActiveChrome())
  const { template } = chrome
  const homePageDef = template.pages.home

  const content = await timeAsync("homepage.pageContent", () =>
    getRequestPageContent<HomepageSnapshot>(template.manifest.id, "page:home").catch(
      () => homePageDef.defaultContent as HomepageSnapshot
    )
  )

  const productGridBlock = content.blocks?.find(
    (b) => b.type === "productGrid" && b.enabled !== false
  )
  const productGridData =
    productGridBlock?.type === "productGrid" ? productGridBlock.data : undefined

  const featuredOptions: HomepageFeaturedResolveOptions = {
    cmsSelectedProductIds: productGridData?.selectedProductIds,
    maxItems: productGridData?.maxItems,
  }

  const deps = await timeAsync("homepage.renderDependencies", () =>
    getHomepageRenderDependencies(featuredOptions)
  )

  const footerData = await timeAsync("homepage.footerContact", () =>
    resolveStorefrontFooterContact(template, {
      homepageContent: content,
      shopContentSnapshot: deps.shopContentSnapshot,
      categoryTreeSnapshot: deps.categoryTreeSnapshot,
    })
  )

  const { products, categories, reviews, siteContact, company, shopEnabled } = deps
  return {
    chrome,
    content,
    dependencies: {
      products,
      categories,
      reviews,
      siteContact,
      company,
      shopEnabled: chrome.shopEnabled && shopEnabled,
      templateId: template.manifest.id,
    },
    footerData,
  }
}
