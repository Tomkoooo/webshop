/** Inputs used to resolve the cover image shown on event cards and detail. */
export type EventHeroSource = {
  heroImage?: string | null
  defaultHeroImage?: string | null
}

/** Event upload wins; otherwise group default hero image. */
export function resolveEventHeroImage(
  event: EventHeroSource,
  group?: EventHeroSource | null
): string {
  const eventHero = event.heroImage?.trim()
  if (eventHero) return eventHero
  return group?.defaultHeroImage?.trim() || ""
}
