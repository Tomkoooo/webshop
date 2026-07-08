import { ProductService } from "@wse/core/services/product"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { resolveProductView } from "@wse/core/lib/product-variants"
import { mediaImageSrc } from "@wse/core/lib/images"
import { getStorefrontChromeBundle } from "@wse/core/lib/storefront-chrome"
import { getStorefrontShopName, withStorefrontPageTitle } from "@wse/core/lib/storefront-page-title"
import { getRequestPageContent } from "@wse/core/lib/cached-storefront"
import {
  getProductPdpContent,
  templateSupportsPerProductPdpCms,
} from "@wse/core/lib/product-page-content"
import { timeDevMetric } from "@wse/core/lib/dev-metrics"

export const revalidate = 60
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const query = await searchParams
  const selectedVariantId = typeof query.variant === "string" ? query.variant : null
  const [product, shopName] = await Promise.all([
    ProductService.getBySlug(slug),
    getStorefrontShopName(),
  ])

  if (!product) {
    return { title: withStorefrontPageTitle("Termék nem található", shopName) }
  }
  const storefrontProduct = product as {
    name: string
    slug: string
    description: string
    images?: string[]
  }
  const view = resolveProductView(product as never, selectedVariantId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://krauszbarkacs.hu"
  const canonicalUrl = `${appUrl}/products/${storefrontProduct.slug}`
  const openGraphImage = view.images?.[0] || storefrontProduct.images?.[0]

  return {
    title: withStorefrontPageTitle(view.seo.title || storefrontProduct.name, shopName),
    description: view.seo.description || storefrontProduct.description.substring(0, 160),
    keywords: view.seo.keywords?.join(", "),
    openGraph: {
      title: view.name || storefrontProduct.name,
      description: view.seo.description || storefrontProduct.description.substring(0, 160),
      images: [mediaImageSrc(openGraphImage)],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

interface ProductPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ variant?: string }>
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params
  const query = await searchParams
  const selectedVariantId = typeof query.variant === "string" ? query.variant : undefined
  const {
    chrome: { template, branding, footerSettings, shopEnabled, Navbar, Footer, NavbarSearch },
    footerHydration,
  } = await timeDevMetric("product.chromeBundle", () => getStorefrontChromeBundle(), {
    category: "page-data",
    route: "/products/[slug]",
    metadata: { slug },
  })

  const usePerProductPdp = templateSupportsPerProductPdpCms(template.manifest.capabilities)

  const [product, pdpContent, footerData] = await timeDevMetric(
    "product.dataBundle",
    () =>
      Promise.all([
        ProductService.getBySlug(slug),
        usePerProductPdp
          ? getProductPdpContent(template.manifest.id, slug)
          : getRequestPageContent(template.manifest.id, "page:pdp"),
        resolveStorefrontFooterContact(template),
      ]),
    {
      category: "page-data",
      route: "/products/[slug]",
      metadata: { slug },
    }
  )

  if (!product) {
    notFound()
  }

  const PdpRender = template.pages.pdp.Render

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={shopEnabled}
        NavbarSearch={NavbarSearch}
      />
      <PdpRender
        content={pdpContent}
        deps={{ product, selectedVariantId, shopEnabled, templateId: template.manifest.id }}
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
    </main>
  )
}
