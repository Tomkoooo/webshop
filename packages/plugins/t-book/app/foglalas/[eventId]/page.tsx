import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { getTBookBookingContent } from "@wse/core/lib/tbook-page-content"
import { TBookBookingWizard } from "@wse/plugin-t-book/storefront/TBookBookingWizard"
import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"

type Props = {
  params: Promise<{ eventId: string }>
}

export default async function FoglalasEventPage({ params }: Props) {
  const { eventId } = await params
  const enabled = await PluginService.isEnabled("t-book")
  if (!enabled) notFound()

  const chrome = await getActiveChrome()
  const siteConfig = await loadTBookStorefrontConfig(chrome.template.manifest.id)
  const bookingCopy = await getTBookBookingContent(chrome.template.manifest.id)
  const apiKey = siteConfig?.tbookApiKey ?? ""

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
      />
      <main className="min-h-[70vh] bg-background px-4 py-10">
        <TBookBookingWizard
          apiKey={apiKey}
          eventId={eventId}
          copy={{
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
          }}
        />
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
