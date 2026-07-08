"use client"

import * as React from "react"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { hasContactFieldValue } from "@wse/core/lib/contact-display"
import type { SiteContactEntry } from "@wse/core/lib/site-contact"
import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { SiteContactEmailsList } from "@wse/core/components/site-contact/SiteContactEmailsList"

interface ContactProps {
  contactEmails?: SiteContactEntry[]
  phone?: string
  address?: string
  title?: string
  description?: string
  sendButtonLabel?: string
  nameLabel?: string
  emailLabel?: string
  messageLabel?: string
}

export function Contact({
  contactEmails = [],
  phone,
  address,
  title,
  description,
  sendButtonLabel,
  nameLabel,
  emailLabel,
  messageLabel,
}: ContactProps) {
  const cms = useCmsEdit()
  const resolvedEmails = contactEmails
  const displayPhone = phone?.trim() ?? ""
  const displayAddress = address?.trim() ?? ""
  const showPhone = cms.enabled || hasContactFieldValue(displayPhone)
  const showEmail = cms.enabled || resolvedEmails.length > 0
  const showAddress = cms.enabled || hasContactFieldValue(displayAddress)

  return (
    <section id="contact" className="py-32 bg-background-dark relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <Reveal>
            {cms.enabled ? (
              <div className="space-y-3">
                <EditableTextInline blockType="contact" field="title" value={title ?? "LOREM IPSUM CONTACT"} className="text-5xl md:text-7xl font-heading font-black text-foreground" />
                <EditableTextInline
                  blockType="contact"
                  field="description"
                  value={description ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                  multiline
                  className="text-neutral-400 text-xl max-w-xl leading-relaxed"
                />
              </div>
            ) : (
              <>
                <h2 className="text-5xl md:text-7xl font-heading font-black mb-10 text-foreground">{title ?? "LOREM IPSUM CONTACT"}</h2>
                <p className="text-neutral-400 text-xl mb-16 max-w-xl leading-relaxed">
                  {description ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                </p>
              </>
            )}

            <div className="space-y-10">
              {showPhone ? (
                <div className="flex items-center gap-8 group">
                  <div className="w-16 h-16 bg-muted/40 flex items-center justify-center border border-border group-hover:border-primary-foreground/50 transition-all">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-heading font-bold uppercase tracking-[0.2em] text-sm mb-1">Phone</h4>
                    {cms.enabled ? (
                      <EditableTextInline blockType="contact" field="phone" value={displayPhone} className="text-neutral-300 text-lg" placeholder="Telefonszám" />
                    ) : (
                      <p className="text-neutral-300 text-lg">{displayPhone}</p>
                    )}
                  </div>
                </div>
              ) : null}

              {showEmail ? (
                <div className="flex items-start gap-8 group">
                  <div className="w-16 h-16 bg-muted/40 flex items-center justify-center border border-border group-hover:border-primary-foreground/50 transition-all shrink-0">
                    <Mail className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-heading font-bold uppercase tracking-[0.2em] text-sm mb-1">Email</h4>
                    {cms.enabled ? (
                      resolvedEmails.length > 0 ? (
                        <SiteContactEmailsList emails={resolvedEmails} className="text-neutral-300 text-lg" />
                      ) : (
                        <p className="text-neutral-500 text-sm">
                          E-mailek: Admin → CMS → Kapcsolat e-mailek
                        </p>
                      )
                    ) : (
                      <SiteContactEmailsList emails={resolvedEmails} className="text-neutral-300 text-lg" />
                    )}
                  </div>
                </div>
              ) : null}

              {showAddress ? (
                <div className="flex items-center gap-8 group">
                  <div className="w-16 h-16 bg-muted/40 flex items-center justify-center border border-border group-hover:border-primary-foreground/50 transition-all">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-heading font-bold uppercase tracking-[0.2em] text-sm mb-1">Address</h4>
                    {cms.enabled ? (
                      <EditableTextInline blockType="contact" field="address" value={displayAddress} className="text-neutral-300 text-lg" placeholder="Cím" />
                    ) : (
                      <p className="text-neutral-300 text-lg">{displayAddress}</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </Reveal>

          <Reveal delayMs={REVEAL_STAGGER_MS}>
            <div className="glass-card p-10 md:p-14 relative border-border/40">
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-foreground/35" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-foreground/35" />

              {cms.enabled ? (
                <Button type="button" className="w-full bg-primary hover:bg-primary text-white h-16 px-12 text-xl btn-krausz border-none">
                  <Send className="w-5 h-5 mr-3" />
                  <EditableTextInline blockType="contact" field="sendButtonLabel" value={sendButtonLabel ?? "SEND MESSAGE"} className="text-white text-center" />
                </Button>
              ) : (
                <ContactInquiryForm
                  contactEmails={resolvedEmails}
                  nameLabel={nameLabel}
                  emailLabel={emailLabel}
                  messageLabel={messageLabel}
                  sendButtonLabel={sendButtonLabel}
                />
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
