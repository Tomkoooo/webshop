import Link from "next/link"
import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { getTBookBookingContent } from "@wse/core/lib/tbook-page-content"
import { TBookBookingWizard } from "@wse/plugin-t-book/storefront/TBookBookingWizard"
import { TBookMultiBookingWizard } from "@wse/plugin-t-book/storefront/TBookMultiBookingWizard"
import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"
import { fetchPublicEventDetailForStorefront } from "@wse/plugin-t-book/lib/fetch-public-storefront"
import { resolveTBookServerApiBase } from "@wse/plugin-t-book/lib/tbook-api-base"
import { tBookMainClassName, isTBookThemedLanding, tBookUiLocale, tBookCopyTone } from "@wse/plugin-t-book/lib/tbook-page-shell"
import { cn } from "@wse/core/lib/utils"

type Props = {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ events?: string }>
}

function parseEventIds(primaryId: string, eventsParam?: string): string[] {
  const fromQuery = (eventsParam ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
  const ids = fromQuery.length > 0 ? fromQuery : [primaryId]
  if (!ids.includes(primaryId)) ids.unshift(primaryId)
  return [...new Set(ids)]
}

export default async function FoglalasEventPage({ params, searchParams }: Props) {
  const { eventId } = await params
  const { events: eventsParam } = await searchParams
  const eventIds = parseEventIds(eventId, eventsParam)
  const multi = eventIds.length > 1

  const enabled = await PluginService.isEnabled("t-book")
  if (!enabled) notFound()

  const chrome = await getActiveChrome()
  const { locale } = chrome
  const templateId = chrome.template.manifest.id
  const uiLocale = tBookUiLocale(templateId, locale)
  const siteConfig = await loadTBookStorefrontConfig(templateId, locale)
  const bookingCopy = await getTBookBookingContent(templateId, locale)
  const apiKey = siteConfig?.tbookApiKey ?? ""
  const apiBase = resolveTBookServerApiBase()
  const eventDetail = multi
    ? undefined
    : await fetchPublicEventDetailForStorefront(apiKey, eventId, apiBase)

  const [footerData, footerHydration] = await Promise.all([
    resolveStorefrontFooterContact(chrome.template),
    getStorefrontFooterHydrationProps(),
  ])
  const { branding, footerSettings, Navbar, Footer, NavbarSearch } = chrome
  const copyTone = tBookCopyTone(templateId)
  const isThemed = isTBookThemedLanding(templateId)

  const copy = {
    stepTicket: bookingCopy.stepTicket,
    stepDetails: bookingCopy.stepDetails,
    stepReview: bookingCopy.stepReview,
    guestsLabel: bookingCopy.guestsLabel,
    hotelLabel: bookingCopy.hotelLabel,
    hotelNone: bookingCopy.hotelNone,
    nightsLabel: bookingCopy.nightsLabel,
    roomTypeLabel: bookingCopy.roomTypeLabel,
    customerHeading: bookingCopy.customerHeading,
    customerHint: bookingCopy.customerHint,
    attendeesHeading: bookingCopy.attendeesHeading,
    attendeesHint: bookingCopy.attendeesHint,
    quoteCta: bookingCopy.quoteCta,
    payCta: bookingCopy.payCta,
    payLoading: bookingCopy.payLoading,
    backLabel: bookingCopy.backLabel,
    nextLabel: bookingCopy.nextLabel,
    reviewHeading: bookingCopy.reviewHeading,
    totalLabel: bookingCopy.totalLabel,
    loadingEvent: bookingCopy.loadingEvent,
    eventError: bookingCopy.eventError,
  }

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
        <div
          className={cn(
            "mx-auto max-w-5xl",
            isThemed &&
              (templateId === "sorfeszt"
                ? "rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
                : "wdf-booking-panel rounded-2xl p-4 sm:p-6")
          )}
        >
          {!multi && eventDetail?.event?.tdarts ? (
            <Link
              href={`/verseny/${eventId}`}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
            >
              🔴 Élő eredmények követése
            </Link>
          ) : !multi && eventDetail?.event?.publicEntryList ? (
            <Link
              href={`/verseny/${eventId}`}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
            >
              Nevezett csapatok
            </Link>
          ) : null}
          {multi ? (
            <TBookMultiBookingWizard
              apiKey={apiKey}
              eventIds={eventIds}
              copy={copy}
              locale={uiLocale}
              copyTone={copyTone}
            />
          ) : (
            <TBookBookingWizard
              apiKey={apiKey}
              eventId={eventId}
              initialEventDetail={eventDetail}
              copy={copy}
              locale={uiLocale}
              copyTone={copyTone}
            />
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
