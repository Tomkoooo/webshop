"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"

const Hero = dynamic(
  () => import("@wse/core/components/sections/Hero").then((m) => ({ default: m.Hero })),
  { ssr: true }
)
import { Story } from "@wse/core/components/sections/Story"
import { Gallery } from "@wse/core/components/sections/Gallery"
import { Shop } from "@wse/core/components/sections/Shop"
import { Features } from "@wse/core/components/sections/Features"
import { Reviews } from "@wse/core/components/sections/Reviews"
import { Contact } from "@wse/core/components/sections/Contact"
import type {
  HomepageBlock,
  HomepageSnapshot,
  HomepageBlockType,
} from "@wse/core/features/homepage-cms/types/block-types"
import type { HomePageDeps } from "@wse/sdk/templates/types"
import { resolveContactDisplayField } from "@wse/core/lib/contact-display"

function isVisible(data: unknown, key: string) {
  const visibility = (data as { visibility?: Record<string, boolean> } | undefined)?.visibility
  if (!visibility) return true
  return visibility[key] !== false
}

function enabledBlocks(snapshot: HomepageSnapshot): HomepageBlock[] {
  return snapshot.blocks.filter((block) => block.enabled !== false)
}

function blockByType(snapshot: HomepageSnapshot, type: HomepageBlockType) {
  return enabledBlocks(snapshot).find((block) => block.type === type)
}

export function RealHomepageSections({
  snapshot,
  dependencies,
}: {
  snapshot: HomepageSnapshot
  dependencies: HomePageDeps
}) {
  const blocks = enabledBlocks(snapshot)
  const hasProductGrid = blocks.some((block) => block.type === "productGrid")
  const hasTestimonialsBlock = blocks.some((block) => block.type === "testimonials")

  const featuresBlock = blockByType(snapshot, "features")
  const featuresData = featuresBlock?.data as
    | {
        title?: string
        subtitle?: string
        cards?: Array<{ title: string; description: string; icon?: string }>
      }
    | undefined

  const featuresSection = featuresBlock ? (
    <Features
      title={isVisible(featuresData, "title") ? featuresData?.title : ""}
      subtitle={isVisible(featuresData, "subtitle") ? featuresData?.subtitle : ""}
      cards={isVisible(featuresData, "cards") ? featuresData?.cards : []}
      embedded={Boolean(hasProductGrid)}
    />
  ) : null

  const legacyShopReviews =
    !hasTestimonialsBlock && dependencies.reviews.length > 0 ? (
      <Reviews reviews={dependencies.reviews} />
    ) : null

  function renderBlock(block: HomepageBlock): ReactNode {
    switch (block.type) {
      case "hero": {
        const hero = block.data as {
          title?: string
          description?: string
          primaryCtaLabel?: string
          primaryCtaHref?: string
          secondaryCtaLabel?: string
          secondaryCtaHref?: string
          heroImage?: string
          heroImages?: string[]
          imageDurationSeconds?: number
          heroDurationSeconds?: number
          heroSlides?: Array<{
            title: string
            description: string
            primaryCtaLabel: string
            primaryCtaHref: string
            secondaryCtaLabel: string
            secondaryCtaHref: string
            badges: string[]
            images: string[]
            imageDurationSeconds: number
            durationSeconds: number
          }>
          badges?: string[]
        }
        return (
          <Hero
            title={isVisible(hero, "title") ? hero.title : ""}
            description={isVisible(hero, "description") ? hero.description : ""}
            primaryCtaLabel={isVisible(hero, "primaryCta") ? hero.primaryCtaLabel : ""}
            primaryCtaHref={hero.primaryCtaHref}
            secondaryCtaLabel={isVisible(hero, "secondaryCta") ? hero.secondaryCtaLabel : ""}
            secondaryCtaHref={hero.secondaryCtaHref}
            heroImage={isVisible(hero, "heroImage") ? hero.heroImage : ""}
            slides={isVisible(hero, "heroSlides") ? hero.heroSlides : []}
            badges={isVisible(hero, "badges") ? hero.badges : []}
          />
        )
      }
      case "about": {
        const about = block.data as {
          title?: string
          paragraph?: string
          accordions?: Array<{ title: string; content: string }>
          cards?: Array<{ title: string; description: string; icon?: string }>
        }
        return (
          <Story
            title={isVisible(about, "title") ? about.title : ""}
            content={isVisible(about, "paragraph") ? about.paragraph : ""}
            accordions={isVisible(about, "accordions") ? about.accordions : []}
            cards={about.cards}
          />
        )
      }
      case "gallery": {
        const gallery = block.data as {
          title?: string
          items?: Array<{ image: string; caption: string }>
        }
        return (
          <Gallery
            title={isVisible(gallery, "title") ? gallery.title : ""}
            items={isVisible(gallery, "items") ? gallery.items : []}
          />
        )
      }
      case "productGrid": {
        const productGrid = block.data as {
          title?: string
          description?: string
          viewAllLabel?: string
          viewAllHref?: string
          categoriesTitle?: string
          categoriesDescription?: string
        }
        return (
          <Shop
            templateId={dependencies.templateId}
            shopEnabled={dependencies.shopEnabled}
            categories={dependencies.categories}
            products={dependencies.products}
            title={isVisible(productGrid, "title") ? productGrid.title : ""}
            description={isVisible(productGrid, "description") ? productGrid.description : ""}
            viewAllLabel={productGrid.viewAllLabel}
            viewAllHref={productGrid.viewAllHref}
            categoriesTitle={isVisible(productGrid, "categoriesTitle") ? productGrid.categoriesTitle : ""}
            categoriesDescription={
              isVisible(productGrid, "categoriesDescription") ? productGrid.categoriesDescription : ""
            }
            afterCategories={featuresSection}
          />
        )
      }
      case "features":
        return hasProductGrid ? null : featuresSection
      case "testimonials": {
        const testimonials = block.data as {
          title?: string
          subtitle?: string
          items?: Array<{
            quote: string
            name: string
            role: string
            sourceUrl?: string
            rating: number
          }>
        }
        const items = testimonials.items ?? []
        const testimonialReviews = items.map((item, index) => ({
          id: `cms-review-${block.id}-${index}`,
          name: item.name,
          role: item.role,
          sourceUrl: item.sourceUrl,
          content: item.quote,
          rating: item.rating,
          avatar: "/generic-logo.svg",
        }))
        return (
          <Reviews
            blockId={block.id}
            reviews={testimonialReviews}
            items={items}
            title={isVisible(testimonials, "title") ? testimonials.title : ""}
            subtitle={isVisible(testimonials, "subtitle") ? testimonials.subtitle : ""}
          />
        )
      }
      case "contact": {
        const contact = block.data as {
          title?: string
          description?: string
          address?: string
          phone?: string
          email?: string
          sendButtonLabel?: string
          nameLabel?: string
          emailLabel?: string
          messageLabel?: string
        }
        return (
          <>
            {legacyShopReviews}
            <Contact
              contactEmails={dependencies.siteContact.emails}
              phone={
                isVisible(contact, "phone")
                  ? resolveContactDisplayField(contact.phone, dependencies.company.phone)
                  : ""
              }
              address={
                isVisible(contact, "address")
                  ? resolveContactDisplayField(contact.address, dependencies.company.address)
                  : ""
              }
              title={isVisible(contact, "title") ? contact.title : ""}
              description={isVisible(contact, "description") ? contact.description : ""}
              sendButtonLabel={contact.sendButtonLabel}
              nameLabel={contact.nameLabel}
              emailLabel={contact.emailLabel}
              messageLabel={contact.messageLabel}
            />
          </>
        )
      }
      default:
        return null
    }
  }

  const rendered = blocks.map((block) => {
    const node = renderBlock(block)
    if (!node) return null
    return <div key={block.id}>{node}</div>
  })

  const hasContact = blocks.some((block) => block.type === "contact")

  return (
    <>
      {rendered}
      {!hasContact ? legacyShopReviews : null}
    </>
  )
}
