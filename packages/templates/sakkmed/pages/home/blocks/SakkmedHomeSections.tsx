"use client"

import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { SiteContactEmailsList } from "@wse/core/components/site-contact/SiteContactEmailsList"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableImage } from "@wse/core/features/homepage-cms/components/primitives/EditableImage"
import { EditableLinkInline } from "@wse/core/features/homepage-cms/components/primitives/EditableLinkInline"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import type { HomepageBlock, HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { mediaImageSrc } from "@wse/core/lib/images"
import { PROJECT_LINKS, SERVICE_LINKS } from "../../../lib/constants"

const HERO_BACKGROUND_FALLBACK = ""
const HERO_BLOCK_ID = "hero-sakkmed"
const SERVICES_BLOCK_ID = "services-sakkmed"
const ABOUT_BLOCK_ID = "about-sakkmed"
const PROJECTS_BLOCK_ID = "projects-sakkmed"
const CLIENTS_BLOCK_ID = "clients-sakkmed"
const GALLERY_BLOCK_ID = "gallery-sakkmed"
const CONTACT_BLOCK_ID = "contact-sakkmed"

type Props = {
  snapshot: HomepageSnapshot
  siteContact: { emails: Array<{ id: string; label: string; email: string }> }
}

function block<T extends { type: string }>(snapshot: HomepageSnapshot, type: T["type"], id?: string) {
  return snapshot.blocks.find(
    (b) => b.type === type && b.enabled !== false && (!id || b.id === id)
  )
}

function patchBlockArray<T extends Record<string, unknown>>(
  cms: ReturnType<typeof useCmsEdit>,
  blockType: HomepageBlock["type"],
  blockId: string,
  field: string,
  items: T[],
  index: number,
  patch: Partial<T>
) {
  cms.patchBlockData(
    blockType,
    {
      [field]: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    },
    blockId
  )
}

function setBlockArray<T>(
  cms: ReturnType<typeof useCmsEdit>,
  blockType: HomepageBlock["type"],
  blockId: string,
  field: string,
  items: T[]
) {
  cms.patchBlockData(blockType, { [field]: items }, blockId)
}

export function SakkmedHomeSections({ snapshot, siteContact }: Props) {
  const cms = useCmsEdit()
  const hero = block(snapshot, "hero", HERO_BLOCK_ID)
  const services = block(snapshot, "features", SERVICES_BLOCK_ID)
  const about = block(snapshot, "about", ABOUT_BLOCK_ID)
  const projects = block(snapshot, "gallery", PROJECTS_BLOCK_ID)
  const clients = block(snapshot, "gallery", CLIENTS_BLOCK_ID)
  const gallery = block(snapshot, "gallery", GALLERY_BLOCK_ID)
  const contact = block(snapshot, "contact", CONTACT_BLOCK_ID)

  const heroData = hero?.type === "hero" ? hero.data : null
  const servicesData = services?.type === "features" ? services.data : null
  const aboutData = about?.type === "about" ? about.data : null
  const projectsData = projects?.type === "gallery" ? projects.data : null
  const clientsData = clients?.type === "gallery" ? clients.data : null
  const galleryData = gallery?.type === "gallery" ? gallery.data : null
  const contactData = contact?.type === "contact" ? contact.data : null

  const heroBackground = heroData?.heroImage || HERO_BACKGROUND_FALLBACK
  const heroBadge = heroData?.badges?.[0] || "SAKKMED 2005 Kft."

  return (
    <>
      <section className="relative -mt-[57px] min-h-[calc(100svh-0px)] overflow-hidden border-b border-border/60 pt-[57px]">
        <div className="absolute inset-0">
          <FallbackImage
            src={mediaImageSrc(heroBackground)}
            alt=""
            fill
            priority={!cms.enabled}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-background" aria-hidden />
        <div className="absolute inset-0 bg-black/35" aria-hidden />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-57px)] max-w-6xl flex-col justify-center px-4 py-16 md:py-24">
          {cms.enabled ? (
            <div className="cms-admin-control mb-6 max-w-md rounded-lg border border-dashed border-white/30 bg-black/70 p-3">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-white/70">Hero háttérkép</p>
              <EditableImage
                src={mediaImageSrc(heroBackground)}
                alt=""
                editMode
                flexibleCrop
                separateControls
                usageLabel="Hero háttérkép"
                className="h-28 w-full object-cover"
                width={2048}
                height={1365}
                onChange={(next) => cms.patchBlockData("hero", { heroImage: next }, HERO_BLOCK_ID)}
              />
            </div>
          ) : null}
          <div className="max-w-2xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              <EditableTextInline
                blockType="hero"
                blockId={HERO_BLOCK_ID}
                field="badges"
                value={heroBadge}
                onCommit={(value) =>
                  cms.patchBlockData("hero", { badges: [value] }, HERO_BLOCK_ID)
                }
              />
            </p>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold uppercase leading-none tracking-tight text-white drop-shadow-md md:text-6xl">
                <EditableTextInline blockType="hero" blockId={HERO_BLOCK_ID} field="title" value={heroData?.title || "A SIKERES"} />
              </h1>
              <p className="text-3xl font-light uppercase tracking-[0.2em] text-white/85 drop-shadow-md md:text-5xl whitespace-pre-line">
                <EditableTextInline
                  blockType="hero"
                  blockId={HERO_BLOCK_ID}
                  field="description"
                  value={heroData?.description || "RENDEZVÉNY\nKIVITELEZŐJE"}
                  multiline
                />
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {cms.enabled ? (
                <>
                  <EditableLinkInline
                    blockType="hero"
                    blockId={HERO_BLOCK_ID}
                    labelField="primaryCtaLabel"
                    hrefField="primaryCtaHref"
                    label={heroData?.primaryCtaLabel || "Kapcsolat"}
                    href={heroData?.primaryCtaHref || "#contact"}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg"
                  />
                  <EditableLinkInline
                    blockType="hero"
                    blockId={HERO_BLOCK_ID}
                    labelField="secondaryCtaLabel"
                    hrefField="secondaryCtaHref"
                    label={heroData?.secondaryCtaLabel || "Szolgáltatások"}
                    href={heroData?.secondaryCtaHref || "#services"}
                    buttonVariant="outline"
                    className="rounded-full border border-white/30 bg-black/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm"
                  />
                </>
              ) : (
                <>
                  <Link
                    href={heroData?.primaryCtaHref || "#contact"}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg"
                  >
                    {heroData?.primaryCtaLabel || "Kapcsolat"}
                  </Link>
                  <Link
                    href={heroData?.secondaryCtaHref || "#services"}
                    className="rounded-full border border-white/30 bg-black/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-black/45"
                  >
                    {heroData?.secondaryCtaLabel || "Szolgáltatások"}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold">
              <EditableTextInline blockType="features" blockId={SERVICES_BLOCK_ID} field="title" value={servicesData?.title || "Szolgáltatásaink"} />
            </h2>
            <p className="mt-3 text-muted-foreground">
              <EditableTextInline blockType="features" blockId={SERVICES_BLOCK_ID} field="subtitle" value={servicesData?.subtitle || ""} multiline />
            </p>
          </div>
          {cms.enabled ? (
            <CmsListAddButton
              label="Új szolgáltatás kártya"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", [
                  ...(servicesData?.cards || []),
                  { title: "Új szolgáltatás", description: "", icon: "" },
                ])
              }
            />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(servicesData?.cards || []).map((card, idx) => (
              <article key={idx} className="space-y-2 rounded-xl border border-border/60 bg-surface/30 p-5">
                {cms.enabled ? (
                  <CmsListItemToolbar
                    canMoveUp={idx > 0}
                    canMoveDown={idx < (servicesData?.cards?.length || 0) - 1}
                    onMoveUp={() =>
                      setBlockArray(
                        cms,
                        "features",
                        SERVICES_BLOCK_ID,
                        "cards",
                        moveArrayItem(servicesData?.cards || [], idx, -1)
                      )
                    }
                    onMoveDown={() =>
                      setBlockArray(
                        cms,
                        "features",
                        SERVICES_BLOCK_ID,
                        "cards",
                        moveArrayItem(servicesData?.cards || [], idx, 1)
                      )
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "features",
                        SERVICES_BLOCK_ID,
                        "cards",
                        (servicesData?.cards || []).filter((_, itemIdx) => itemIdx !== idx)
                      )
                    }
                  />
                ) : null}
                <h3 className="text-lg font-semibold text-primary">
                  <EditableTextInline
                    blockType="features"
                    blockId={SERVICES_BLOCK_ID}
                    field={`cards.${idx}.title`}
                    value={card.title}
                    onCommit={(value) =>
                      patchBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", servicesData?.cards || [], idx, {
                        title: value,
                      })
                    }
                  />
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  <EditableTextInline
                    blockType="features"
                    blockId={SERVICES_BLOCK_ID}
                    field={`cards.${idx}.description`}
                    value={card.description.replace(/\s*\|\s*/g, "\n")}
                    multiline
                    onCommit={(value) =>
                      patchBlockArray(cms, "features", SERVICES_BLOCK_ID, "cards", servicesData?.cards || [], idx, {
                        description: value,
                      })
                    }
                  />
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {SERVICE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-border/70 px-4 py-2 text-xs font-medium uppercase tracking-wide hover:border-primary hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="border-b border-border/60 bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-3xl font-bold">
            <EditableTextInline blockType="about" blockId={ABOUT_BLOCK_ID} field="title" value={aboutData?.title || "Rólunk"} />
          </h2>
          {(aboutData?.paragraph || cms.enabled) && (
            <p className="mb-10 max-w-3xl text-muted-foreground leading-relaxed whitespace-pre-line">
              <EditableTextInline
                blockType="about"
                blockId={ABOUT_BLOCK_ID}
                field="paragraph"
                value={aboutData?.paragraph || ""}
                multiline
              />
            </p>
          )}
          {cms.enabled ? (
            <CmsListAddButton
              label="Új statisztika"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", [
                  ...(aboutData?.cards || []),
                  { title: "0", description: "Új elem", icon: "" },
                ])
              }
            />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {(aboutData?.cards || []).map((card, idx) => (
              <div key={idx} className="space-y-2 rounded-xl border border-border/60 bg-background p-6 text-center">
                {cms.enabled ? (
                  <CmsListItemToolbar
                    canMoveUp={idx > 0}
                    canMoveDown={idx < (aboutData?.cards?.length || 0) - 1}
                    onMoveUp={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "cards",
                        moveArrayItem(aboutData?.cards || [], idx, -1)
                      )
                    }
                    onMoveDown={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "cards",
                        moveArrayItem(aboutData?.cards || [], idx, 1)
                      )
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "cards",
                        (aboutData?.cards || []).filter((_, itemIdx) => itemIdx !== idx)
                      )
                    }
                  />
                ) : null}
                <p className="text-4xl font-bold text-primary">
                  <EditableTextInline
                    blockType="about"
                    blockId={ABOUT_BLOCK_ID}
                    field={`cards.${idx}.title`}
                    value={card.title}
                    onCommit={(value) =>
                      patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", aboutData?.cards || [], idx, {
                        title: value,
                      })
                    }
                  />
                </p>
                <p className="mt-2 text-sm uppercase tracking-wide text-muted-foreground">
                  <EditableTextInline
                    blockType="about"
                    blockId={ABOUT_BLOCK_ID}
                    field={`cards.${idx}.description`}
                    value={card.description}
                    onCommit={(value) =>
                      patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "cards", aboutData?.cards || [], idx, {
                        description: value,
                      })
                    }
                  />
                </p>
              </div>
            ))}
          </div>
          {cms.enabled ? (
            <CmsListAddButton
              label="Új accordion"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", [
                  ...(aboutData?.accordions || []),
                  { title: "Új blokk", content: "" },
                ])
              }
            />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {(aboutData?.accordions || []).map((item, idx) => (
              <div key={idx} className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-5">
                {cms.enabled ? (
                  <CmsListItemToolbar
                    canMoveUp={idx > 0}
                    canMoveDown={idx < (aboutData?.accordions?.length || 0) - 1}
                    onMoveUp={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "accordions",
                        moveArrayItem(aboutData?.accordions || [], idx, -1)
                      )
                    }
                    onMoveDown={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "accordions",
                        moveArrayItem(aboutData?.accordions || [], idx, 1)
                      )
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "about",
                        ABOUT_BLOCK_ID,
                        "accordions",
                        (aboutData?.accordions || []).filter((_, itemIdx) => itemIdx !== idx)
                      )
                    }
                  />
                ) : null}
                <h3 className="font-semibold text-primary">
                  <EditableTextInline
                    blockType="about"
                    blockId={ABOUT_BLOCK_ID}
                    field={`accordions.${idx}.title`}
                    value={item.title}
                    onCommit={(value) =>
                      patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", aboutData?.accordions || [], idx, {
                        title: value,
                      })
                    }
                  />
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  <EditableTextInline
                    blockType="about"
                    blockId={ABOUT_BLOCK_ID}
                    field={`accordions.${idx}.content`}
                    value={item.content.replace(/\s*\|\s*/g, "\n")}
                    multiline
                    onCommit={(value) =>
                      patchBlockArray(cms, "about", ABOUT_BLOCK_ID, "accordions", aboutData?.accordions || [], idx, {
                        content: value,
                      })
                    }
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-3xl font-bold">
            <EditableTextInline blockType="gallery" blockId={PROJECTS_BLOCK_ID} field="title" value={projectsData?.title || "Projektjeink"} />
          </h2>
          {cms.enabled ? (
            <CmsListAddButton
              label="Új projekt"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", [
                  ...(projectsData?.items || []),
                  { image: "", caption: "Új projekt" },
                ])
              }
            />
          ) : null}
          <div className="grid gap-6 md:grid-cols-2">
            {(projectsData?.items || []).map((item, idx) => {
              const href = PROJECT_LINKS[idx]?.href || "#"
              const card = (
                <>
                  {cms.enabled ? (
                    <CmsListItemToolbar
                      className="px-3 pt-3"
                      canMoveUp={idx > 0}
                      canMoveDown={idx < (projectsData?.items?.length || 0) - 1}
                      onMoveUp={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          PROJECTS_BLOCK_ID,
                          "items",
                          moveArrayItem(projectsData?.items || [], idx, -1)
                        )
                      }
                      onMoveDown={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          PROJECTS_BLOCK_ID,
                          "items",
                          moveArrayItem(projectsData?.items || [], idx, 1)
                        )
                      }
                      onRemove={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          PROJECTS_BLOCK_ID,
                          "items",
                          (projectsData?.items || []).filter((_, itemIdx) => itemIdx !== idx)
                        )
                      }
                    />
                  ) : null}
                  <div className={cms.enabled ? "" : "relative aspect-[16/10] overflow-hidden"}>
                    {cms.enabled ? (
                      <EditableImage
                        src={mediaImageSrc(item.image)}
                        alt={item.caption || ""}
                        editMode
                        flexibleCrop
                        separateControls
                        className="aspect-[16/10] h-auto w-full object-cover"
                        width={960}
                        height={600}
                        onChange={(next) =>
                          patchBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", projectsData?.items || [], idx, {
                            image: next,
                          })
                        }
                      />
                    ) : (
                      <FallbackImage src={mediaImageSrc(item.image)} alt={item.caption || ""} fill className="object-cover transition group-hover:scale-105" />
                    )}
                  </div>
                  <div className="bg-surface/40 px-4 py-3 font-semibold">
                    <EditableTextInline
                      blockType="gallery"
                      blockId={PROJECTS_BLOCK_ID}
                      field={`items.${idx}.caption`}
                      value={item.caption || ""}
                      onCommit={(value) =>
                        patchBlockArray(cms, "gallery", PROJECTS_BLOCK_ID, "items", projectsData?.items || [], idx, {
                          caption: value,
                        })
                      }
                    />
                  </div>
                </>
              )
              return cms.enabled ? (
                <div key={idx} className="group rounded-xl border border-border/60">
                  {card}
                </div>
              ) : (
                <Link key={idx} href={href} className="group overflow-hidden rounded-xl border border-border/60">
                  {card}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section id="clients" className="border-b border-border/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold uppercase tracking-[0.2em]">
            <EditableTextInline blockType="gallery" blockId={CLIENTS_BLOCK_ID} field="title" value={clientsData?.title || "Ügyfeleink"} />
          </h2>
          {cms.enabled ? (
            <CmsListAddButton
              label="Új partner logó"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "gallery", CLIENTS_BLOCK_ID, "items", [
                  ...(clientsData?.items || []),
                  { image: "", caption: "" },
                ])
              }
            />
          ) : null}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {(clientsData?.items || []).map((item, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border/40 bg-background/40 p-4">
                {cms.enabled ? (
                  <>
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < (clientsData?.items?.length || 0) - 1}
                      onMoveUp={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          CLIENTS_BLOCK_ID,
                          "items",
                          moveArrayItem(clientsData?.items || [], idx, -1)
                        )
                      }
                      onMoveDown={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          CLIENTS_BLOCK_ID,
                          "items",
                          moveArrayItem(clientsData?.items || [], idx, 1)
                        )
                      }
                      onRemove={() =>
                        setBlockArray(
                          cms,
                          "gallery",
                          CLIENTS_BLOCK_ID,
                          "items",
                          (clientsData?.items || []).filter((_, itemIdx) => itemIdx !== idx)
                        )
                      }
                    />
                    <EditableImage
                      src={mediaImageSrc(item.image)}
                      alt={item.caption || "Partner"}
                      editMode
                      separateControls
                      className="h-12 w-auto max-w-[160px] object-contain opacity-80"
                      width={160}
                      height={80}
                      onChange={(next) =>
                        patchBlockArray(cms, "gallery", CLIENTS_BLOCK_ID, "items", clientsData?.items || [], idx, {
                          image: next,
                        })
                      }
                    />
                  </>
                ) : (
                  <FallbackImage src={mediaImageSrc(item.image)} alt={item.caption || "Partner"} width={160} height={80} className="h-12 w-auto object-contain opacity-80" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-3xl font-bold">
            <EditableTextInline blockType="gallery" blockId={GALLERY_BLOCK_ID} field="title" value={galleryData?.title || "Galéria"} />
          </h2>
          {cms.enabled ? (
            <CmsListAddButton
              label="Új galéria kép"
              className="mb-4"
              onClick={() =>
                setBlockArray(cms, "gallery", GALLERY_BLOCK_ID, "items", [
                  ...(galleryData?.items || []),
                  { image: "", caption: "" },
                ])
              }
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(galleryData?.items || []).map((item, idx) => (
              <figure key={idx} className="space-y-2 rounded-xl border border-border/60 p-2">
                {cms.enabled ? (
                  <CmsListItemToolbar
                    canMoveUp={idx > 0}
                    canMoveDown={idx < (galleryData?.items?.length || 0) - 1}
                    onMoveUp={() =>
                      setBlockArray(
                        cms,
                        "gallery",
                        GALLERY_BLOCK_ID,
                        "items",
                        moveArrayItem(galleryData?.items || [], idx, -1)
                      )
                    }
                    onMoveDown={() =>
                      setBlockArray(
                        cms,
                        "gallery",
                        GALLERY_BLOCK_ID,
                        "items",
                        moveArrayItem(galleryData?.items || [], idx, 1)
                      )
                    }
                    onRemove={() =>
                      setBlockArray(
                        cms,
                        "gallery",
                        GALLERY_BLOCK_ID,
                        "items",
                        (galleryData?.items || []).filter((_, itemIdx) => itemIdx !== idx)
                      )
                    }
                  />
                ) : null}
                {cms.enabled ? (
                  <EditableImage
                    src={mediaImageSrc(item.image)}
                    alt={item.caption || ""}
                    editMode
                    flexibleCrop
                    separateControls
                    className="aspect-[4/3] h-auto w-full object-cover rounded-lg"
                    width={800}
                    height={600}
                    onChange={(next) =>
                      patchBlockArray(cms, "gallery", GALLERY_BLOCK_ID, "items", galleryData?.items || [], idx, {
                        image: next,
                      })
                    }
                  />
                ) : (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <FallbackImage src={mediaImageSrc(item.image)} alt={item.caption || ""} fill className="object-cover" />
                  </div>
                )}
                {(item.caption || cms.enabled) && (
                  <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                    <EditableTextInline
                      blockType="gallery"
                      blockId={GALLERY_BLOCK_ID}
                      field={`items.${idx}.caption`}
                      value={item.caption || ""}
                      onCommit={(value) =>
                        patchBlockArray(cms, "gallery", GALLERY_BLOCK_ID, "items", galleryData?.items || [], idx, {
                          caption: value,
                        })
                      }
                    />
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-3xl font-bold">
            <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="title" value={contactData?.title || "Kapcsolat"} />
          </h2>
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-6 rounded-xl border border-border/60 bg-surface/30 p-6 text-sm">
              <div>
                <h3 className="font-semibold text-primary">
                  <EditableTextInline
                    blockType="contact"
                    blockId={CONTACT_BLOCK_ID}
                    field="warehouseTitle"
                    value={contactData?.warehouseTitle || "Raktár, árukiadás"}
                  />
                </h3>
                <div className="mt-2 whitespace-pre-line text-muted-foreground">
                  <EditableTextInline
                    blockType="contact"
                    blockId={CONTACT_BLOCK_ID}
                    field="warehouseBody"
                    value={
                      contactData?.warehouseBody ||
                      "1194 Budapest, Vásár tér 1.\nNyitvatartás: Hétfő – Péntek 7:15 – 15:15\nBencs János | Logisztikai vezető — bencs.janos@esemenyszervezes.hu\nTömöri Gyula | Technikai vezető — tomori.gyula@esemenyszervezes.hu"
                    }
                    multiline
                  />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Központi iroda</h3>
                <p className="mt-2">
                  <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="companyName" value={contactData?.companyName || "SAKKMED 2005 Kft."} />
                </p>
                <p>
                  <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="address" value={contactData?.address || "1095 Budapest, Soroksári út 48."} />
                </p>
                <p className="text-muted-foreground">
                  <EditableTextInline
                    blockType="contact"
                    blockId={CONTACT_BLOCK_ID}
                    field="officeTaxId"
                    value={contactData?.officeTaxId || "Adószám: 13543011-2-43"}
                  />
                </p>
                <p className="mt-2">
                  <EditableTextInline
                    blockType="contact"
                    blockId={CONTACT_BLOCK_ID}
                    field="officeManagerLine"
                    value={contactData?.officeManagerLine || "Balázs Gábor | ügyvezető — balazs.gabor@esemenyszervezes.hu"}
                  />
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">BTL Ügynökség Kft.</h3>
                <div className="mt-2 whitespace-pre-line">
                  <EditableTextInline
                    blockType="contact"
                    blockId={CONTACT_BLOCK_ID}
                    field="btlBlock"
                    value={
                      contactData?.btlBlock ||
                      "1095 Budapest, Soroksári út 48. · Adószám: 23729825-2-43\nKovács Henriette | ügyvezető — kovacs.henriette@esemenyszervezes.hu"
                    }
                    multiline
                  />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Pénzügy</h3>
                <p className="mt-2">
                  <EditableTextInline
                    blockType="contact"
                    blockId={CONTACT_BLOCK_ID}
                    field="financeBlock"
                    value={contactData?.financeBlock || "Marti Csillag | Pénzügyi vezető — marti.csillag@esemenyszervezes.hu"}
                  />
                </p>
              </div>
              <p className="text-muted-foreground">
                <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="description" value={contactData?.description || ""} multiline />
              </p>
              {siteContact.emails.length > 0 ? (
                <SiteContactEmailsList emails={siteContact.emails} className="text-accent" itemClassName="underline" />
              ) : null}
            </div>
            {siteContact.emails.length > 0 ? (
              <div className="rounded-xl border border-border/60 bg-background p-6 space-y-4">
                <div className="grid gap-2 text-sm">
                  <label className="text-muted-foreground">
                    Űrlap — név mező
                    <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="nameLabel" value={contactData?.nameLabel || "Név"} className="mt-1" />
                  </label>
                  <label className="text-muted-foreground">
                    Űrlap — e-mail mező
                    <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="emailLabel" value={contactData?.emailLabel || "E-mail"} className="mt-1" />
                  </label>
                  <label className="text-muted-foreground">
                    Űrlap — üzenet mező
                    <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="messageLabel" value={contactData?.messageLabel || "Üzenet"} className="mt-1" />
                  </label>
                  <label className="text-muted-foreground">
                    Küldés gomb
                    <EditableTextInline blockType="contact" blockId={CONTACT_BLOCK_ID} field="sendButtonLabel" value={contactData?.sendButtonLabel || "Küldés"} className="mt-1" />
                  </label>
                </div>
                <ContactInquiryForm
                  contactEmails={siteContact.emails}
                  nameLabel={contactData?.nameLabel || "Név"}
                  emailLabel={contactData?.emailLabel || "E-mail"}
                  messageLabel={contactData?.messageLabel || "Üzenet"}
                  sendButtonLabel={contactData?.sendButtonLabel || "Küldés"}
                  recipientLabel="Címzett"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Kapcsolatfelvételi űrlaphoz adj meg címzett e-mailt a CMS → Weboldal beállítások → Kapcsolat e-mailek menüben.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
