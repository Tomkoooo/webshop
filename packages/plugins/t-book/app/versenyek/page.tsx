import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { TBookTournamentList, type TBookTournamentListCopy } from "@wse/plugin-t-book/storefront/TBookTournamentList"
import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"
import { fetchPublicEventsForStorefront } from "@wse/plugin-t-book/lib/fetch-public-storefront"
import { fetchTDartsOverview, type TDartsTournamentOverview } from "@wse/plugin-t-book/lib/tdarts-embed-client"
import { resolveTBookServerApiBase } from "@wse/plugin-t-book/lib/tbook-api-base"
import { tBookMainClassName, tBookUiLocale } from "@wse/plugin-t-book/lib/tbook-page-shell"
import type { TBookPublicEvent } from "@wse/plugin-t-book/storefront/tbook-public-api"

const COPY_HU: TBookTournamentListCopy = {
  pageTitle: "Versenyek",
  pageIntro: "A World Darts Festival tornái dátum szerint csoportosítva — élő eredményekkel és jegyvásárlással.",
  emptyTitle: "Jelenleg nincs meghirdetett verseny",
  emptyBody: "Nézz vissza később, vagy tekintsd meg az összes elérhető jegyet.",
  buyTickets: "Jegyvásárlás",
  viewTournament: "Verseny megtekintése",
  entryListOnly: "Nevezési lista",
  salesClosed: "Az értékesítés lezárult",
  salesUpcoming: "Hamarosan nyílik",
  playersLabel: "fő",
  freeEntry: "Ingyenes",
}

const COPY_EN: TBookTournamentListCopy = {
  pageTitle: "Tournaments",
  pageIntro: "World Darts Festival tournaments, grouped by date — with live results and direct ticket purchase.",
  emptyTitle: "No tournaments announced yet",
  emptyBody: "Check back soon, or browse all available tickets.",
  buyTickets: "Buy tickets",
  viewTournament: "View tournament",
  entryListOnly: "Entry list",
  salesClosed: "Sales closed",
  salesUpcoming: "Opens soon",
  playersLabel: "players",
  freeEntry: "Free",
}

function isTournamentEvent(event: TBookPublicEvent): boolean {
  return Boolean(event.tdarts) || Boolean(event.publicEntryList)
}

export default async function VersenyekPage() {
  const enabled = await PluginService.isEnabled("t-book")
  if (!enabled) notFound()

  const chrome = await getActiveChrome()
  const { locale } = chrome
  const templateId = chrome.template.manifest.id
  const uiLocale = tBookUiLocale(templateId, locale)
  const siteConfig = await loadTBookStorefrontConfig(templateId, locale)
  const apiKey = siteConfig?.tbookApiKey ?? ""
  const apiBase = resolveTBookServerApiBase()
  const { events, currency } = await fetchPublicEventsForStorefront(apiKey, apiBase)

  const tournamentEvents = events.filter(isTournamentEvent)

  const overviewEntries = await Promise.all(
    tournamentEvents
      .filter((event) => event.tdarts)
      .map(async (event) => {
        const tdarts = event.tdarts!
        const overview: TDartsTournamentOverview | null = await fetchTDartsOverview(
          { apiBaseUrl: tdarts.apiBaseUrl, embedClientId: tdarts.embedClientId },
          tdarts.tournamentCode
        )
        return [event.id, overview] as const
      })
  )
  const overviews = Object.fromEntries(overviewEntries)

  const [footerData, footerHydration] = await Promise.all([
    resolveStorefrontFooterContact(chrome.template),
    getStorefrontFooterHydrationProps(),
  ])
  const { branding, footerSettings, Navbar, Footer, NavbarSearch } = chrome
  const copy = uiLocale?.startsWith("hu") ? COPY_HU : COPY_EN

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
        <div className="mx-auto max-w-5xl">
          <TBookTournamentList
            events={tournamentEvents}
            overviews={overviews}
            copy={copy}
            locale={uiLocale}
            currency={currency}
          />
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
