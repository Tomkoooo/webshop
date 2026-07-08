import type { ContactBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { hasContactFieldValue, resolveContactDisplayField } from "@wse/core/lib/contact-display"
import type { SiteContact } from "@wse/core/lib/site-contact"
import { SiteContactEmailsList } from "@wse/core/components/site-contact/SiteContactEmailsList"
import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { Mail, MapPin, Phone } from "lucide-react"

export function ContactBlockView({
  block,
  company,
  siteContact,
}: {
  block: ContactBlock
  company: {
    name: string
    address: string
    phone: string
    email: string
    contactEmails: Array<{ id: string; label: string; email: string }>
  }
  siteContact?: SiteContact
}) {
  const emails = siteContact?.emails ?? company.contactEmails
  const companyName = block.data.companyName || company.name
  const address = resolveContactDisplayField(block.data.address, company.address)
  const phone = resolveContactDisplayField(block.data.phone, company.phone)

  return (
    <section id="contact" className="border-b border-border bg-background py-20">
      <div className="container mx-auto space-y-8 px-4">
        <h2 className="text-3xl font-black text-foreground">{block.data.title}</h2>
        <p className="text-muted-foreground">{block.data.description}</p>
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="border border-border bg-muted/30 p-4 space-y-3">
            <h3 className="font-bold text-foreground">{companyName}</h3>
            {hasContactFieldValue(address) ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary-foreground shrink-0" />
                {address}
              </p>
            ) : null}
            {hasContactFieldValue(phone) ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary-foreground shrink-0" />
                {phone}
              </p>
            ) : null}
            {emails.length > 0 ? (
              <div className="text-muted-foreground">
                <p className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-primary-foreground shrink-0" />
                  <span className="font-medium text-foreground">E-mail</span>
                </p>
                <SiteContactEmailsList emails={emails} className="text-sm" />
              </div>
            ) : null}
          </article>
          <div className="border border-border bg-muted/30 p-4">
            <ContactInquiryForm
              contactEmails={emails}
              nameLabel={block.data.nameLabel}
              emailLabel={block.data.emailLabel}
              messageLabel={block.data.messageLabel}
              sendButtonLabel={block.data.sendButtonLabel}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
