import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";

/** App is DB-backed; skip static prerender during Docker/CI build (no Mongo available). */
export const dynamic = "force-dynamic";
/* globals.css is imported by the site app's generated layout stub (see `wse sync`). */
import {
  getRequestSeoSettings,
  getRequestBrandingSettings,
  getRequestActiveTemplateInfo,
  getCachedThemeForTemplate,
} from "@wse/core/lib/cached-storefront";
import { readPreviewTemplateId } from "@wse/core/services/template-preview";
import { getTemplateByIdAsync, loadTemplateModule } from "@wse/core/templates/registry";
import { getEffectiveThemeBase, ThemeService } from "@wse/core/services/theme";
import { themeTokensToCssVars } from "@wse/core/lib/theme-css-vars";
import { themeTypographyToCssVars } from "@wse/sdk/theme/typography";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

import { Providers } from "@wse/core/components/Providers";
import {
  GoogleTagManagerBodyNoscript,
  GoogleTagManagerHead,
} from "@wse/core/components/analytics/GoogleTagManager";
import { Toaster } from "@wse/core/components/ui/sonner";
import { PopupCampaignService } from "@wse/core/services/popup-campaign";
import { isAdminChromePath } from "@wse/core/lib/admin-chrome-path";
import { ADMIN_THEME_BOOT_SCRIPT } from "@wse/core/lib/admin-theme";
import { isShopEnabled } from "@wse/core/lib/features/shop";
import { getRequestLocale, stripLocalePrefix } from "@wse/core/lib/locale";
import { getSiteLocaleConfig } from "@wse/core/lib/site-features";
import { headers } from "next/headers";

function toAbsoluteUrl(value: string, fallbackBase: string): string {
  if (!value) return fallbackBase;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${fallbackBase}${value.startsWith("/") ? value : `/${value}`}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const [seo, branding] = await Promise.all([getRequestSeoSettings(), getRequestBrandingSettings()]);
  const envBase = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const canonicalBase = seo.canonicalBaseUrl || envBase;
  let metadataBase: URL;
  try {
    metadataBase = new URL(canonicalBase);
  } catch {
    metadataBase = new URL(envBase);
  }
  const defaultRobots = { index: seo.robotsIndex, follow: seo.robotsFollow };
  const ogImage = toAbsoluteUrl(seo.ogImage, canonicalBase);
  const twitterImage = toAbsoluteUrl(seo.twitterImage, canonicalBase);

  const localeConfig = getSiteLocaleConfig();
  let languages: Record<string, string> | undefined;
  if (localeConfig) {
    const pathname = (await headers()).get("x-pathname") ?? "/";
    const stripped = stripLocalePrefix(pathname, localeConfig.supported);
    const basePath = stripped ? stripped.rest : pathname;
    languages = {};
    for (const loc of localeConfig.supported) {
      const prefixedPath = loc === localeConfig.default ? basePath : `/${loc}${basePath === "/" ? "" : basePath}`;
      languages[loc] = `${canonicalBase}${prefixedPath}`;
    }
  }

  return {
    title: seo.siteTitle,
    description: seo.siteDescription,
    metadataBase,
    icons: {
      icon: seo.favicon || "/generic-favicon.svg",
    },
    openGraph: {
      title: seo.siteTitle,
      description: seo.siteDescription,
      siteName: branding.brandName,
      locale: seo.defaultLocale || "en_US",
      images: [ogImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.siteTitle,
      description: seo.siteDescription,
      images: [twitterImage],
    },
    robots: defaultRobots,
    alternates: {
      canonical: canonicalBase,
      ...(languages ? { languages } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [seo, activeInfo, previewTemplateId, requestLocale] = await Promise.all([
    getRequestSeoSettings(),
    getRequestActiveTemplateInfo(),
    readPreviewTemplateId(),
    getRequestLocale(),
  ]);
  const dbActiveTemplate = await getTemplateByIdAsync(activeInfo.templateId);
  const isPreviewingDifferentTemplate =
    previewTemplateId != null && previewTemplateId !== activeInfo.templateId;
  const theme = isPreviewingDifferentTemplate
    ? getEffectiveThemeBase(await loadTemplateModule(previewTemplateId))
    : await getCachedThemeForTemplate(dbActiveTemplate);
  const typography = await ThemeService.getTypographyForTemplate(dbActiveTemplate);
  const themeVars = {
    ...themeTokensToCssVars(theme),
    ...themeTypographyToCssVars(typography),
  };
  const pathname = (await headers()).get("x-pathname") ?? "";
  const adminChrome = isAdminChromePath(pathname);
  const popupCampaigns = adminChrome
    ? []
    : await PopupCampaignService.getActiveForStorefront();

  return (
    <html
      lang={requestLocale !== "en" ? requestLocale : seo.defaultLocale?.split("_")[0] || "en"}
      style={themeVars}
      data-template={dbActiveTemplate.manifest.id}
    >
      <head>
        {adminChrome ? (
          <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_BOOT_SCRIPT }} />
        ) : null}
        <GoogleTagManagerHead />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: "body,body *{opacity:1!important;transform:none!important}",
            }}
          />
        </noscript>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased`}
      >
        <GoogleTagManagerBodyNoscript />
        <Providers
          devMetricsEnabled={
            process.env.DEV_METRICS === "1" || process.env.DEV_METRICS?.toLowerCase() === "true"
          }
          popupCampaigns={popupCampaigns}
          shopEnabled={isShopEnabled()}
          adminChrome={adminChrome}
        >
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
