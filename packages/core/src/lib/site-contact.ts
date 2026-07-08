import { cache } from "react"
import {
  formatContactEmailsForDisplay,
  parseContactEmailsFromShopContent,
  primaryContactEmail,
  type ContactEmailEntry,
} from "@wse/core/lib/contact-emails"
import { resolveContactDisplayField } from "@wse/core/lib/contact-display"
import { ShopContentService } from "@wse/core/services/shop-content"

/** Template-facing contact entry (admin-managed e-mail list). */
export type SiteContactEntry = ContactEmailEntry

/** Site-wide contact channels for storefront + template `deps.siteContact`. */
export type SiteContact = {
  emails: SiteContactEntry[]
  primaryEmail: string
  emailsDisplay: string
  phone: string
  address: string
}

/** E-mail címek kizárólag az admin „Kapcsolat e-mailek” listájából (ShopContent `contact_emails`). */
export function resolveSiteContactEmails(
  shopContent: Record<string, string | undefined>
): ContactEmailEntry[] {
  return parseContactEmailsFromShopContent(shopContent)
}

export function resolveSiteContactChannels(
  shopContent: Record<string, string | undefined>,
  cmsOverrides?: { phone?: string | null; address?: string | null }
): SiteContact {
  const contactEmails = resolveSiteContactEmails(shopContent)
  const primaryEmail = primaryContactEmail(contactEmails)

  return {
    emails: contactEmails,
    primaryEmail,
    emailsDisplay:
      contactEmails.length > 0
        ? formatContactEmailsForDisplay(contactEmails)
        : "",
    phone: resolveContactDisplayField(
      cmsOverrides?.phone,
      shopContent.contact_phone
    ),
    address: resolveContactDisplayField(
      cmsOverrides?.address,
      shopContent.contact_address
    ),
  }
}

/** Cached shop-wide contact for layouts, footers, and page deps. */
export const getStorefrontSiteContact = cache(async function getStorefrontSiteContact(
  cmsOverrides?: { phone?: string | null; address?: string | null }
): Promise<SiteContact> {
  const shopContent = await ShopContentService.getAll()
  return resolveSiteContactChannels(shopContent, cmsOverrides)
})
