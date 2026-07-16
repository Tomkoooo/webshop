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
import { tBookMainClassName } from "@wse/plugin-t-book/lib/tbook-page-shell"
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
  const siteConfig = await loadTBookStorefrontConfig(chrome.template.manifest.id)
  const bookingCopy = await getTBookBookingContent(chrome.template.manifest.id)
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
  const templateId = chrome.template.manifest.id
  const isWdf = templateId === "world-darts-festival"

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
      />
      <main className={tBookMainClassName(templateId)}>
        <div
          className={cn(
            "mx-auto max-w-5xl",
            isWdf && "wdf-booking-panel rounded-2xl p-4 sm:p-6"
          )}
        >
          {multi ? (
            <TBookMultiBookingWizard apiKey={apiKey} eventIds={eventIds} copy={copy} />
          ) : (
            <TBookBookingWizard
              apiKey={apiKey}
              eventId={eventId}
              initialEventDetail={eventDetail}
              copy={copy}
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
      />
    </>
  )
}
