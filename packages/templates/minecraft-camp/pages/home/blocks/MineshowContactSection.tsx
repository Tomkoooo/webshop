"use client"

import type { SiteContact } from "@wse/core/lib/site-contact"
import { SiteContactEmailsList } from "@wse/core/components/site-contact/SiteContactEmailsList"
import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { MineshowContactMap } from "./MineshowContactMap"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"

const BLOCK_ID = "contact-venue"

type ContactBlockData = {
  title?: string
  description?: string
  companyName?: string
  address?: string
  phone?: string
  email?: string
  mapEmbedUrl?: string
  sendButtonLabel?: string
  nameLabel?: string
  emailLabel?: string
  messageLabel?: string
}

type Props = {
  siteContact: SiteContact
  contactData?: ContactBlockData | null
  mapEmbedUrl: string
  venueAddress: string
}

export function MineshowContactSection({
  siteContact,
  contactData,
  mapEmbedUrl,
  venueAddress,
}: Props) {
  const cms = useCmsEdit()
  const emails = siteContact.emails
  const hasForm = emails.length > 0
  const addressTitle = contactData?.title || contactData?.address || venueAddress

  return (
    <section id="contact" className="bg-[#b8d88a] border-t-4 border-[#3d2817]/20">
      {mapEmbedUrl || cms.enabled ? (
        <MineshowContactMap
          addressTitle={addressTitle}
          email={contactData?.email}
          companyName={contactData?.companyName}
          mapEmbedUrl={mapEmbedUrl}
        />
      ) : null}

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="minecraft-panel p-5 md:p-6 space-y-4 font-minecraft-body text-sm text-[#3d2817]">
            <h2 className="font-minecraft text-xs text-[#2d5016]">
              <EditableTextInline
                blockType="contact"
                blockId={BLOCK_ID}
                field="title"
                value={contactData?.title || "Kapcsolat"}
                className="text-[#2d5016] text-xs font-minecraft"
              />
            </h2>
            {contactData?.description || cms.enabled ? (
              <p>
                <EditableTextInline
                  blockType="contact"
                  blockId={BLOCK_ID}
                  field="description"
                  value={contactData?.description ?? ""}
                  multiline
                  className="text-[#3d2817] text-sm font-minecraft-body"
                />
              </p>
            ) : null}
            {contactData?.companyName || cms.enabled ? (
              <p className="font-semibold">
                <EditableTextInline
                  blockType="contact"
                  blockId={BLOCK_ID}
                  field="companyName"
                  value={contactData?.companyName ?? ""}
                  className="text-[#3d2817] text-sm font-semibold font-minecraft-body"
                />
              </p>
            ) : null}
            {contactData?.address || venueAddress || cms.enabled ? (
              <p>
                <EditableTextInline
                  blockType="contact"
                  blockId={BLOCK_ID}
                  field="address"
                  value={contactData?.address || venueAddress}
                  className="text-[#3d2817] text-sm font-minecraft-body"
                />
              </p>
            ) : null}
            {contactData?.phone || cms.enabled ? (
              <p>
                <EditableTextInline
                  blockType="contact"
                  blockId={BLOCK_ID}
                  field="phone"
                  value={contactData?.phone ?? ""}
                  className="text-[#3d2817] text-sm font-minecraft-body"
                />
              </p>
            ) : null}
            {emails.length > 0 ? (
              <div>
                <p className="font-minecraft text-[10px] text-[#2d5016] mb-2">E-mail</p>
                <SiteContactEmailsList
                  emails={emails}
                  className="text-[#1a3d5c]"
                  itemClassName="underline"
                />
              </div>
            ) : null}
            {!hasForm ? (
              <p className="text-xs text-[#5c4a32]">
                Kapcsolatfelvételi űrlaphoz adj meg címzett e-mailt a CMS → Weboldal beállítások →
                Kapcsolat e-mailek menüben.
              </p>
            ) : null}
          </div>

          {hasForm ? (
            <div className="minecraft-panel p-5 md:p-6 mineshow-contact-form">
              <h2 className="font-minecraft text-xs text-[#2d5016] mb-4">Írj nekünk</h2>
              <ContactInquiryForm
                contactEmails={emails}
                nameLabel={contactData?.nameLabel || "Név"}
                emailLabel={contactData?.emailLabel || "E-mail"}
                messageLabel={contactData?.messageLabel || "Üzenet"}
                sendButtonLabel={contactData?.sendButtonLabel || "Üzenet küldése"}
                recipientLabel="Címzett"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
