import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"

const DEFAULT_MAP_EMBED =
  "https://maps.google.com/maps?q=R%C3%A9csei%20Center,%20Budapest&t=&z=15&ie=UTF8&iwloc=&output=embed"

export type MineshowSiteConfig = {
  venueShort: string
  venueAddress: string
  mapEmbedUrl: string
}

function findBlock(snapshot: HomepageSnapshot, type: string, id?: string) {
  return snapshot.blocks.find(
    (b) => b.type === type && b.enabled !== false && (!id || b.id === id)
  )
}

/** Reads venue, map, and hero badge text from homepage CMS blocks. */
export function extractMineshowSiteConfig(snapshot: HomepageSnapshot): MineshowSiteConfig {
  const hero = findBlock(snapshot, "hero")
  const contact = findBlock(snapshot, "contact", "contact-venue")

  const heroBadges =
    hero?.type === "hero" && Array.isArray(hero.data.badges) ? hero.data.badges : []
  const contactData = contact?.type === "contact" ? contact.data : null

  const venueShort =
    contactData?.venueShort?.trim() ||
    heroBadges[0]?.trim() ||
    ""
  const venueAddress =
    contactData?.address?.trim() ||
    contactData?.title?.trim() ||
    ""
  const mapEmbedUrl = contactData?.mapEmbedUrl?.trim() || DEFAULT_MAP_EMBED

  return { venueShort, venueAddress, mapEmbedUrl }
}
