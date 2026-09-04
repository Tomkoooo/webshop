import Link from "next/link"
import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { TDartsTournamentEmbed } from "@wse/plugin-t-book/storefront/TDartsTournamentEmbed"
import { TBookTeamEntryList } from "@wse/plugin-t-book/storefront/TBookTeamEntryList"
import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"
import {
  fetchPublicEntryListForStorefront,
  fetchPublicEventDetailForStorefront,
} from "@wse/plugin-t-book/lib/fetch-public-storefront"
import { resolveTBookServerApiBase } from "@wse/plugin-t-book/lib/tbook-api-base"
import { tBookMainClassName, tBookUiLocale } from "@wse/plugin-t-book/lib/tbook-page-shell"

type Props = {
  params: Promise<{ eventId: string }>
}

/**
 * Read-only live event page for an event linked to a tDarts tournament, or
 * (when no tDarts link exists) an event with a public entry list enabled —
 * e.g. a large-roster team tournament that tDarts' partner API can't
 * auto-sync (see `tdarts-sync-service.ts`). Reads only: for the tDarts case,
 * the browser talks directly to api.tdarts.hu (moderators manage the
 * tournament exclusively on tdarts.hu); for the entry-list case, the data
 * comes straight from tBook's own bookings — no writes happen on this page
 * either way.
 */
export default async function TDartsTournamentPage({ params }: Props) {
  const { eventId } = await params

  const enabled = await PluginService.isEnabled("t-book")
  if (!enabled) notFound()

  const chrome = await getActiveChrome()
  const { locale } = chrome
  const templateId = chrome.template.manifest.id
  const uiLocale = tBookUiLocale(templateId, locale)
  const siteConfig = await loadTBookStorefrontConfig(templateId, locale)
  const apiKey = siteConfig?.tbookApiKey ?? ""
  const apiBase = resolveTBookServerApiBase()
  const { event } = await fetchPublicEventDetailForStorefront(apiKey, eventId, apiBase)

  if (!event) notFound()
  if (!event.tdarts && !event.publicEntryList) notFound()

  const entryList = event.tdarts
    ? null
    : await fetchPublicEntryListForStorefront(apiKey, eventId, apiBase)
  if (!event.tdarts && (!entryList || entryList.error)) notFound()

  const [footerData, footerHydration] = await Promise.all([
    resolveStorefrontFooterContact(chrome.template),
    getStorefrontFooterHydrationProps(),
  ])
  const { branding, footerSettings, Navbar, Footer, NavbarSearch } = chrome

  return (
    <>
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={false}
        NavbarSearch={NavbarSearch}
        navItems={siteConfig?.navItems}
        navCta={siteConfig?.navCta}
        tickerText={siteConfig?.tickerText}
        locale={uiLocale}
      />
      <main className={tBookMainClassName(templateId)}>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="mb-4 text-sm text-muted-foreground">
            <Link href={`/foglalas/${eventId}`} className="underline underline-offset-2">
              ← {event.name}
            </Link>
          </p>
          {event.tdarts ? (
            <TDartsTournamentEmbed
              tournamentCode={event.tdarts.tournamentCode}
              apiBaseUrl={event.tdarts.apiBaseUrl}
              embedClientId={event.tdarts.embedClientId}
              locale={uiLocale}
            />
          ) : (
            <TBookTeamEntryList teams={entryList?.teams ?? []} />
          )}
        </div>
      </main>
      <Footer
        brandName={branding.brandName}
        logoSrc={branding.logoFooter}
        shopEnabled={false}
        categories={footerData.categories}
        footerSettings={footerSettings}
        email={footerData.email}
        contactEmails={footerData.contactEmails}
        phone={footerData.phone}
        address={footerData.address}
        newsletterEnabled={footerHydration.newsletterEnabled}
        legalLinks={footerHydration.legalLinks}
        locale={uiLocale}
      />
    </>
  )
}
