import { ProductService } from "@wse/core/services/product"
import { CategoryService } from "@wse/core/services/category"
import { Button } from "@wse/core/components/ui/button"
import { Metadata } from "next"
import Link from "next/link"
import {
  getCachedFeatureFlag,
  getRequestCategoryTree,
  getRequestPageContent,
  getRequestShopContent,
} from "@wse/core/lib/cached-storefront"
import { getStorefrontChromeBundle } from "@wse/core/lib/storefront-chrome"
import { TemplateService } from "@wse/core/services/template"

export const revalidate = 60
import {
  resolveStorefrontFooterContact,
  type CategoryTreeNode,
} from "@wse/core/lib/storefront-footer-data"
import { resolveCommerceShopRendering } from "@wse/core/templates/resolve-commerce-slots"
import { storefrontCatalogFilters } from "@wse/core/lib/storefront-catalog"
import { getStorefrontShopName, withStorefrontPageTitle } from "@wse/core/lib/storefront-page-title"
import { timeDevMetric } from "@wse/core/lib/dev-metrics"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}): Promise<Metadata> {
  const { q, category } = await searchParams
  const template = await TemplateService.getActive()
  const [content, shopPageContent, shopName] = await Promise.all([
    getRequestShopContent(),
    getRequestPageContent(template.manifest.id, "page:shop").catch(() => null),
    getStorefrontShopName(),
  ])

  type ShopSeo = { meta?: { seoTitle?: string; seoDescription?: string } }
  const shopMeta = shopPageContent as ShopSeo | null
  const baseTitle =
    shopMeta?.meta?.seoTitle ||
    content.shop_seo_title ||
    withStorefrontPageTitle("Webshop", shopName)
  const baseDescription =
    shopMeta?.meta?.seoDescription ||
    content.shop_seo_description ||
    `Válogasson prémium termékeink közül a ${shopName} webshopban.`

  let title = baseTitle
  let description = baseDescription

  if (q) {
    title = withStorefrontPageTitle(`Keresés: ${q}`, shopName)
  } else if (category) {
    const cat = await CategoryService.getById(category)
    if (cat) {
      title = withStorefrontPageTitle(cat.name, shopName)
      description = cat.seo?.description || description
    }
  }

  return {
    title,
    description,
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    q?: string
    category?: string
    discounted?: string
    sort?: string
  }>
}) {
  const isShopPageEnabled = await timeDevMetric(
    "shop.featureFlag",
    () => getCachedFeatureFlag("shopPage", true),
    { category: "page-data", route: "/shop" }
  )
  const {
    chrome: { template, branding, footerSettings, shopEnabled, Navbar, Footer, NavbarSearch },
    footerHydration,
  } = await timeDevMetric("shop.chromeBundle", () => getStorefrontChromeBundle(), {
    category: "page-data",
    route: "/shop",
  })
  const shopPageDef = template.pages.shop
  const shopRaw = await timeDevMetric(
    "shop.pageContent",
    () =>
      getRequestPageContent(template.manifest.id, "page:shop").catch(
        () => shopPageDef.defaultContent
      ),
    { category: "page-data", route: "/shop" }
  )
  const shopContent = shopRaw as typeof shopPageDef.defaultContent

  if (!isShopPageEnabled) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-20 px-6 text-foreground">
        <Navbar
          brandName={branding.brandName}
          logoSrc={branding.logoNav}
          shopEnabled={shopEnabled}
          NavbarSearch={NavbarSearch}
        />
        <div className="container mx-auto">
          <div className="mx-auto max-w-2xl space-y-6 border border-border bg-muted/40 p-10 text-center">
            <p className="text-xl font-black uppercase tracking-widest text-foreground">
              jelenleg nem elérhető vissza a főoldalra
            </p>
            <Link href="/">
              <Button className="h-12 rounded-none bg-primary px-8 font-black uppercase tracking-widest text-xs text-primary-foreground hover:bg-primary/85">
                Vissza a főoldalra
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const params = await searchParams
  const currentPage = parseInt(params.page || "1")
  const limit = shopContent.pageSize ?? 12

  const filters = {
    search: params.q,
    category: params.category,
    isDiscounted: params.discounted === "true",
    sort: params.sort || "featured",
    ...storefrontCatalogFilters(),
  }

  const [paginationResult, categoriesResult, contentDoc] =
    await timeDevMetric("shop.productsAndFilters", () => Promise.all([
      ProductService.getStorefrontPaginated(currentPage, limit, filters),
      getRequestCategoryTree(),
      getRequestShopContent(),
    ]), {
      category: "page-data",
      route: "/shop",
      metadata: { currentPage, limit, sort: filters.sort, hasSearch: Boolean(filters.search) },
    })

  const products = JSON.parse(JSON.stringify(paginationResult.products))
  const total = paginationResult.total
  const pages = paginationResult.pages
  const categories = JSON.parse(JSON.stringify(categoriesResult))

  const footerData = await timeDevMetric(
    "shop.footerContact",
    () =>
      resolveStorefrontFooterContact(template, {
        shopContentSnapshot: contentDoc,
        categoryTreeSnapshot: categoriesResult as CategoryTreeNode[],
      }),
    { category: "page-data", route: "/shop" }
  )

  const ShopRender = shopPageDef.Render

  return (
    <>
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={shopEnabled}
        NavbarSearch={NavbarSearch}
      />
      <ShopRender
        content={shopContent}
        deps={{
          products,
          categories,
          total,
          pages,
          currentPage,
          query: {
            q: params.q,
            category: params.category,
            discounted: params.discounted === "true",
            sort: params.sort,
            page: currentPage,
          },
          shopRendering: resolveCommerceShopRendering(template),
          shopEnabled: shopEnabled && isShopPageEnabled,
        }}
      />
      <Footer
        brandName={branding.brandName}
        logoSrc={branding.logoFooter}
        shopEnabled={shopEnabled}
        categories={footerData.categories}
        footerSettings={footerSettings}
        email={footerData.email}
        contactEmails={footerData.contactEmails}
        phone={footerData.phone}
        address={footerData.address}
        newsletterEnabled={footerHydration.newsletterEnabled}
        legalLinks={footerHydration.legalLinks}
      />
    </>
  )
}
