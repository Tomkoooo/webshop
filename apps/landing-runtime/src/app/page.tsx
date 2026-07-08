import { headers } from "next/headers"
import { HomepageRenderer } from "@wse/core/features/homepage-cms/render/HomepageRenderer"
import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { resolveTenantByHost } from "../lib/tenants"
import {
  getTenantBranding,
  getTenantHomepageBlocks,
  getTenantReviews,
} from "../lib/tenant-data"

export const dynamic = "force-dynamic"

export default async function TenantHomePage() {
  const host = (await headers()).get("host")
  const tenant = resolveTenantByHost(host)

  if (!tenant) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">No site is configured for this domain</h1>
          <p className="mt-2 text-sm opacity-70">
            Register this host in the landing runtime tenant registry to serve a site here.
          </p>
        </div>
      </main>
    )
  }

  const [blocks, branding, reviews] = await Promise.all([
    getTenantHomepageBlocks(tenant),
    getTenantBranding(tenant),
    getTenantReviews(tenant),
  ])

  return (
    <main>
      <HomepageRenderer
        blocks={blocks as HomepageBlock[]}
        reviews={reviews}
        products={[]}
        categories={[]}
        company={{
          name: branding.brandName,
          address: "",
          phone: "",
          email: "",
          contactEmails: [],
        }}
      />
    </main>
  )
}
