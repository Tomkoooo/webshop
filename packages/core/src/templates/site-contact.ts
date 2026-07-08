/**
 * Template integration for admin-managed contact e-mails.
 *
 * @example Homepage render
 * ```tsx
 * import type { HomePageDeps } from "@wse/sdk/templates/types"
 * import { SiteContactEmailsList, ContactInquiryForm } from "@wse/core/templates/site-contact"
 *
 * export function HomeRender({ deps }: { deps: HomePageDeps }) {
 *   const { emails, phone, address } = deps.siteContact
 *   return (
 *     <section>
 *       <SiteContactEmailsList emails={emails} />
 *       <ContactInquiryForm contactEmails={emails} />
 *     </section>
 *   )
 * }
 * ```
 *
 * Footer chrome receives `contactEmails` from the engine (see `template.chrome.Footer` props).
 */
export type { SiteContact, SiteContactEntry } from "@wse/core/lib/site-contact"
export { SiteContactEmailsList, siteContactEmailsPlainText } from "@wse/core/components/site-contact/SiteContactEmailsList"
export { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
export type { ContactInquiryFormLabels } from "@wse/core/components/site-contact/ContactInquiryForm"
