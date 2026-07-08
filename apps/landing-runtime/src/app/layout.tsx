import type { Metadata } from "next"
import { headers } from "next/headers"
import "./globals.css"
import { resolveTenantByHost } from "../lib/tenants"
import { getTenantSeo, getTenantTheme } from "../lib/tenant-data"

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host")
  const tenant = resolveTenantByHost(host)
  if (!tenant) return { title: "Landing runtime" }
  const seo = await getTenantSeo(tenant)
  return {
    title: seo.siteTitle,
    description: seo.siteDescription,
    robots: seo.robotsIndex ? undefined : { index: false, follow: false },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host")
  const tenant = resolveTenantByHost(host)
  const theme = tenant ? await getTenantTheme(tenant) : {}
  const themeVars = Object.fromEntries(
    Object.entries(theme).map(([key, value]) => [
      `--theme-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
      value,
    ])
  ) as React.CSSProperties

  return (
    <html lang="hu" style={themeVars}>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
