/** How an active event appears on the public /jegyek listing. */
export type TBookEventPublicListing = "listed" | "link_only"

export function isEventListedOnPublicSite(
  publicListing: TBookEventPublicListing | string | null | undefined
): boolean {
  return publicListing !== "link_only"
}

export function publicBookingPath(eventId: string): string {
  return `/foglalas/${eventId}`
}
