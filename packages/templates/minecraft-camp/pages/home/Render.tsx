import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import { pressStart2P } from "../../fonts"
import { extractMineshowSiteConfig } from "../../lib/site-config"
import type { HomeContent } from "./schema"
import { MineshowHero } from "./blocks/MineshowHero"
import { MineshowStory } from "./blocks/MineshowStory"
import { MineshowPrograms } from "./blocks/MineshowPrograms"
import { MineshowSessions } from "./blocks/MineshowSessions"
import { MineshowPricing } from "./blocks/MineshowPricing"
import { MineshowFaq } from "./blocks/MineshowFaq"
import { MineshowContactSection } from "./blocks/MineshowContactSection"
import { MineshowSocialTab } from "./blocks/MineshowSocialTab"
import { MINECRAFT_CAMP_FACEBOOK_EVENT_URL } from "../../lib/constants"

function getBlock<T extends { type: string }>(
  snapshot: HomepageSnapshot,
  type: T["type"],
  id?: string
) {
  return snapshot.blocks.find(
    (b) => b.type === type && b.enabled !== false && (!id || b.id === id)
  )
}

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  const snapshot = content
  const site = extractMineshowSiteConfig(snapshot)
  const hero = getBlock(snapshot, "hero")
  const story = getBlock(snapshot, "about", "story-zsdav")
  const programsIntro = getBlock(snapshot, "richText", "programs-intro")
  const gallery = getBlock(snapshot, "gallery", "programs-gallery")
  const pricing = getBlock(snapshot, "about", "pricing-info")
  const faq = getBlock(snapshot, "about", "faq-mineshow")
  const contact = getBlock(snapshot, "contact", "contact-venue")

  const heroData = hero?.type === "hero" ? hero.data : null
  const storyData = story?.type === "about" ? story.data : null
  const galleryData = gallery?.type === "gallery" ? gallery.data : null
  const pricingData = pricing?.type === "about" ? pricing.data : null
  const faqData = faq?.type === "about" ? faq.data : null
  const contactData = contact?.type === "contact" ? contact.data : null

  const programsIntroText =
    programsIntro?.type === "richText"
      ? programsIntro.data.html.replace(/<[^>]+>/g, "")
      : undefined

  const venueBadge = site.venueShort || heroData?.badges?.[0] || ""
  const legacyCard = storyData?.cards?.[0]
  const facebookEventUrl =
    storyData?.bannerHref?.trim() || MINECRAFT_CAMP_FACEBOOK_EVENT_URL

  return (
    <div className={`minecraft-page-mineshow ${pressStart2P.variable}`}>
      <MineshowSocialTab href={facebookEventUrl} />

      {heroData ? (
        <MineshowHero
          heroImage={heroData.heroImage || heroData.heroImages?.[0] || ""}
          badge={venueBadge}
          ctaLabel={heroData.primaryCtaLabel || "Jelentkezés"}
          ctaHref={heroData.primaryCtaHref || "/jegyvasarlas"}
          tagline={storyData?.title || ""}
        />
      ) : null}

      {storyData ? (
        <MineshowStory
          title=""
          image={storyData.image || legacyCard?.icon || "/generic-hero.svg"}
          boxHeading={storyData.boxHeading || legacyCard?.title || ""}
          body={storyData.paragraph || legacyCard?.description || ""}
          ctaLabel={storyData.ctaLabel || heroData?.primaryCtaLabel || "Jelentkezés"}
          ctaHref={storyData.ctaHref || heroData?.primaryCtaHref || "/jegyvasarlas"}
          bannerText={storyData.bannerText || ""}
          bannerHref={facebookEventUrl}
        />
      ) : null}

      {galleryData ? (
        <MineshowPrograms
          title={galleryData.title || "Programok"}
          items={galleryData.items || []}
          intro={programsIntroText}
        />
      ) : null}

      <MineshowSessions />

      {pricingData ? (
        <MineshowPricing title={pricingData.title} body={pricingData.paragraph} />
      ) : null}

      {faqData?.accordions?.length ? (
        <MineshowFaq title={faqData.title} items={faqData.accordions} />
      ) : null}

      {contactData || site.mapEmbedUrl || deps.siteContact.emails.length > 0 ? (
        <MineshowContactSection
          siteContact={deps.siteContact}
          contactData={contactData ?? undefined}
          mapEmbedUrl={contactData?.mapEmbedUrl || site.mapEmbedUrl}
          venueAddress={site.venueAddress}
        />
      ) : null}
    </div>
  )
}
