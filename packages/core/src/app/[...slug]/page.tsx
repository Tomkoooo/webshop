import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontChromeBundle } from "@wse/core/lib/storefront-chrome"
import { getRequestPageContent } from "@wse/core/lib/cached-storefront"
import { timeDevMetric } from "@wse/core/lib/dev-metrics"

export const revalidate = 60
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { getStorefrontShopName, withStorefrontPageTitle } from "@wse/core/lib/storefront-page-title"

type StaticPageProps = {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params
  const slugStr = slug.join("/")
  const { template } = await getActiveChrome()
  const def = template.staticPages[slugStr]
  if (!def) return {}
  try {
    const [content, shopName] = await Promise.all([
      getRequestPageContent<{
        meta?: { seoTitle?: string; seoDescription?: string }
      }>(template.manifest.id, `page:${slugStr}`),
      getStorefrontShopName(),
    ])
    const seoTitle = content?.meta?.seoTitle?.trim()
    return {
      title: seoTitle ? withStorefrontPageTitle(seoTitle, shopName) : undefined,
      description: content?.meta?.seoDescription || undefined,
    }
  } catch {
    return {}
  }
}

export default async function StaticTemplatePage({ params }: StaticPageProps) {
  const { slug } = await params
  const slugStr = slug.join("/")
  const {
    chrome: { template, branding, footerSettings, shopEnabled, Navbar, Footer, NavbarSearch },
    footerHydration,
  } = await timeDevMetric("static.chromeBundle", () => getStorefrontChromeBundle(), {
    category: "page-data",
    route: "/[...slug]",
    metadata: { slug: slugStr },
  })

  const def = template.staticPages[slugStr]
  if (!def) {
    notFound()
  }

  const [content, footerData] = await timeDevMetric(
    "static.dataBundle",
    () =>
      Promise.all([
        getRequestPageContent(template.manifest.id, `page:${slugStr}`),
        resolveStorefrontFooterContact(template),
      ]),
    {
      category: "page-data",
      route: "/[...slug]",
      metadata: { slug: slugStr },
    }
  )
  const Render = def.Render

  return (
    <>
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={shopEnabled}
        NavbarSearch={NavbarSearch}
      />
      <Render
        content={content}
        deps={{
          branding: {
            brandName: branding.brandName,
            logoNav: branding.logoNav,
            logoFooter: branding.logoFooter,
          },
          contactEmails: footerData.contactEmails,
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
