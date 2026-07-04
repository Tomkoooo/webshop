import { BrandingSettingsService } from "@/services/branding-settings"
import { ThemeService } from "@/services/theme"
import { getStorefrontSiteContact } from "@/lib/site-contact"
import { getEmailFromAddress } from "@/lib/email-from"
import { loadPluginModule } from "@/plugins/registry"
import { PluginService } from "@/services/plugin"
import { getPublicAppBaseUrl } from "@/lib/app-base-url"
import type { EmailTemplateSeed } from "@/services/email-template"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function getPublicBaseUrl() {
  return getPublicAppBaseUrl()
}

/** Core transactional templates (shop, contact, invoicing). */
export async function buildCoreEmailTemplateSeeds(): Promise<EmailTemplateSeed[]> {
  const [branding, theme, siteContact] = await Promise.all([
    BrandingSettingsService.get(),
    ThemeService.get(),
    getStorefrontSiteContact(),
  ])

  const shopName = escapeHtml(branding.brandName)
  const primaryForeground = theme.primaryForeground
  const secondary = theme.secondary
  const secondaryForeground = theme.secondaryForeground
  const background = theme.background
  const foreground = theme.foreground
  const mutedForeground = theme.mutedForeground
  const border = theme.border
  const contactUrl = `${getPublicBaseUrl()}/#contact`
  const noReplyAddress = escapeHtml(getEmailFromAddress())
  const contactEmails = siteContact.emails.length
    ? siteContact.emails
        .map((entry) => `${escapeHtml(entry.label)}: ${escapeHtml(entry.email)}`)
        .join(" · ")
    : "a weboldalon található kapcsolatfelvételi űrlapon"
  const footer = `
          <hr style="border:0;border-top:1px solid ${border};margin:30px 0;" />
          <p style="font-size:12px;line-height:1.6;color:${mutedForeground};">
            Ez egy automatikus, no-reply üzenet a(z) ${noReplyAddress} címről. Kérjük, ne válaszolj erre az e-mailre.
            Kapcsolatfelvételhez írj a weboldalon keresztül: <a href="${contactUrl}" style="color:${primaryForeground};font-weight:bold;">Kapcsolat</a>,
            vagy használd az alábbi elérhetőségeket: ${contactEmails}.
          </p>
          <p style="font-size:12px;color:${mutedForeground};">${shopName}</p>
  `

  return [
    {
      type: "order_confirmation",
      pluginId: null,
      tags: ["core", "shop", "order"],
      subject: `${branding.brandName} rendelés visszaigazolása - #{{orderNumber}}`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${background};color:${foreground};">
          <h1 style="color:${primaryForeground};text-transform:uppercase;">Köszönjük a rendelésed!</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${shopName} örömmel értesít, hogy megkaptuk a rendelésed (#{{orderNumber}}).</p>
          <div style="background:${secondary};color:${secondaryForeground};padding:15px;margin:20px 0;border:1px solid ${border};">
            <h3 style="margin-top: 0;">Rendelés összefoglaló:</h3>
            <p>Végösszeg: <strong>{{totalAmount}} Ft</strong></p>
            <p>Szállítási cím: {{shippingAddress}}</p>
          </div>
          <p>Amint csomagja útra kel, újabb értesítést küldünk.</p>
          {{#if orderViewUrl}}
          <p style="margin: 28px 0 12px;">
            <a href="{{orderViewUrl}}" style="display:inline-block;background:${secondary};color:${secondaryForeground};padding:12px 18px;text-decoration:none;font-weight:bold;">Rendelés megtekintése</a>
          </p>
          {{/if}}
          ${footer}
        </div>
      `,
      description:
        "Webshop rendelés — vásárló kapja meg sikeres kosár/checkout után. Nem használja a tábor foglalás plugin.",
      variables: [
        "orderNumber",
        "customerName",
        "totalAmount",
        "items",
        "shippingAddress",
        "orderViewUrl",
        "linkToAccountUrl",
        "isGuestOrder",
      ],
    },
    {
      type: "order_status_change",
      pluginId: null,
      tags: ["core", "shop", "order"],
      subject: `${branding.brandName} rendelés állapotának változása - #{{orderNumber}}`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${background};color:${foreground};">
          <h1 style="color:${primaryForeground};text-transform:uppercase;">Frissítés a rendelésedről</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${shopName} értesít, hogy a #{{orderNumber}} számú rendelésed állapota megváltozott.</p>
          <div style="background:${secondary};color:${secondaryForeground};padding:15px;margin:20px 0;text-align:center;border:1px solid ${border};">
            <p style="margin:0;font-size:14px;">Régi: {{oldStatus}}</p>
            <p style="margin:10px 0;font-size:24px;font-weight:bold;color:${primaryForeground};">Új: {{newStatus}}</p>
          </div>
          ${footer}
        </div>
      `,
      description: "Webshop rendelés állapotváltozás — nem tábor foglalás.",
      variables: ["orderNumber", "customerName", "oldStatus", "newStatus"],
    },
    {
      type: "order_cancelled",
      pluginId: null,
      tags: ["core", "shop", "order"],
      subject: `${branding.brandName} rendelés törölve - #{{orderNumber}}`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${background};color:${foreground};">
          <h1 style="color:${primaryForeground};text-transform:uppercase;">Rendelés törölve</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${shopName} értesít, hogy a #{{orderNumber}} számú rendelésed törölve lett.</p>
          <div style="background:${secondary};color:${secondaryForeground};padding:15px;margin:20px 0;text-align:center;border:1px solid ${border};">
            <p style="margin:0;font-size:14px;">Régi állapot: {{oldStatus}}</p>
            <p style="margin:10px 0;font-size:24px;font-weight:bold;color:${primaryForeground};">Új állapot: {{newStatus}}</p>
          </div>
          {{#if cancellationReason}}
          <div style="background:${background};padding:15px;margin:20px 0;border:1px solid ${border};">
            <p style="margin:0 0 8px;font-size:12px;font-weight:bold;text-transform:uppercase;color:${mutedForeground};">Indoklás</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.6;">{{cancellationReason}}</p>
          </div>
          {{/if}}
          {{#if reversalInvoiceId}}
          <p>A sztornó számla azonosítója: <strong>{{reversalInvoiceId}}</strong>. A PDF csatolmányként is megkapod.</p>
          {{/if}}
          <p>Ha kártyás fizetéssel rendeltél, a visszatérítés a bankod szabályai szerint jelenik meg.</p>
          ${footer}
        </div>
      `,
      description:
        "Admin rendelés törlés — a vásárló kapja meg az állapotváltozás mellett (opcionális indoklással). Pár: order_status_change.",
      variables: ["orderNumber", "customerName", "oldStatus", "newStatus", "cancellationReason", "reversalInvoiceId"],
    },
    {
      type: "invoice_sent",
      pluginId: null,
      tags: ["core", "shop", "invoicing", "szamlazz"],
      subject: `${branding.brandName} számla elkészült - #{{orderNumber}} / {{invoiceId}}`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${background};color:${foreground};">
          <h1 style="color:${primaryForeground};text-transform:uppercase;">Számla elkészült</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${shopName} #{{orderNumber}} rendeléséhez tartozó számla elkészült (Számlázz.hu).</p>
          <p>Számla azonosító: <strong>{{invoiceId}}</strong></p>
          <p>{{invoiceMessage}}</p>
          ${footer}
        </div>
      `,
      description:
        "Sikeres Számlázz.hu számla — PDF csatolmánnyal. Pár: invoice_issue (hiba / kézi beavatkozás esetén).",
      variables: ["orderNumber", "customerName", "invoiceId", "invoiceMessage"],
    },
    {
      type: "invoice_issue",
      pluginId: null,
      tags: ["core", "shop", "invoicing", "szamlazz", "szamlazz-failure"],
      subject: `${branding.brandName} számlázási értesítés - #{{orderNumber}}`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${background};color:${foreground};">
          <h1 style="color:${primaryForeground};text-transform:uppercase;">Számlázási értesítés</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${shopName} #{{orderNumber}} rendelésének számlázása manuális ellenőrzést igényel.</p>
          <p>{{invoiceMessage}}</p>
          ${footer}
        </div>
      `,
      description:
        "Ha a Számlázz.hu kiállítás vagy küldés sikertelen — értesíti a vásárlót. Pár: invoice_sent (sikeres számla).",
      variables: ["orderNumber", "customerName", "invoiceMessage"],
    },
    {
      type: "contact_form_notification",
      pluginId: null,
      tags: ["core", "contact"],
      subject: `${branding.brandName} kapcsolatfelvétel - {{name}}`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${background};color:${foreground};">
          <h1 style="color:${primaryForeground};text-transform:uppercase;">Új kapcsolatfelvételi üzenet</h1>
          <div style="background:${secondary};color:${secondaryForeground};padding:15px;margin:20px 0;border:1px solid ${border};">
            <p><strong>Név:</strong> {{name}}</p>
            <p><strong>Feladó e-mail:</strong> {{email}}</p>
            <p><strong>Címzett:</strong> {{recipientLabel}} &lt;{{recipientEmail}}&gt;</p>
            <p><strong>Üzenet azonosító:</strong> {{contactMessageId}}</p>
          </div>
          <p style="white-space:normal;">{{{messageHtml}}}</p>
          ${footer}
        </div>
      `,
      description: "Belső értesítés a weboldali kapcsolat űrlapról (minden sablon).",
      variables: [
        "name",
        "email",
        "message",
        "messageHtml",
        "recipientLabel",
        "recipientEmail",
        "contactMessageId",
      ],
    },
    {
      type: "contact_reply",
      pluginId: null,
      tags: ["core", "contact"],
      subject: "{{subject}}",
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${background};color:${foreground};">
          <div style="line-height:1.6;">{{{bodyHtml}}}</div>
          <hr style="border:0;border-top:1px solid ${border};margin:28px 0;" />
          <p style="font-size:13px;color:${mutedForeground};"><strong>{{originalName}}</strong> &lt;{{originalEmail}}&gt;</p>
          <p style="font-size:13px;color:${mutedForeground};">{{{originalMessageHtml}}}</p>
          ${footer}
        </div>
      `,
      description: "Admin válasz a kapcsolatfelvételi üzenetre.",
      variables: [
        "subject",
        "bodyHtml",
        "bodyText",
        "originalName",
        "originalEmail",
        "originalMessage",
        "originalMessageHtml",
        "adminName",
        "adminEmail",
      ],
    },
  ]
}

/** Enabled plugins may contribute additional templates (e.g. camp-booking). */
export async function collectPluginEmailTemplateSeeds(): Promise<EmailTemplateSeed[]> {
  const enabled = await PluginService.listEnabled()
  const seeds: EmailTemplateSeed[] = []

  for (const entry of enabled) {
    const mod = await loadPluginModule(entry.id)
    const pluginSeeds = [
      ...(mod.emailTemplates ?? []),
      ...(mod.getEmailTemplates ? await mod.getEmailTemplates() : []),
    ]
    if (!pluginSeeds.length) continue
    for (const seed of pluginSeeds) {
      seeds.push({
        ...seed,
        pluginId: seed.pluginId ?? entry.id,
        tags: seed.tags?.length ? seed.tags : [entry.id],
      })
    }
  }

  return seeds
}

export async function buildAllEmailTemplateSeeds(): Promise<EmailTemplateSeed[]> {
  const [core, plugin] = await Promise.all([
    buildCoreEmailTemplateSeeds(),
    collectPluginEmailTemplateSeeds(),
  ])
  return [...core, ...plugin]
}

export const EMAIL_TEMPLATE_TYPE_LABELS: Record<string, string> = {
  order_confirmation: "Rendelés visszaigazolása (webshop)",
  order_status_change: "Rendelés állapot (webshop)",
  order_cancelled: "Rendelés törlése (webshop — admin)",
  invoice_sent: "Számla elküldve (Számlázz — siker)",
  invoice_issue: "Számlázási probléma (Számlázz — hiba pár)",
  contact_form_notification: "Kapcsolatfelvétel (belső)",
  contact_reply: "Kapcsolat válasz",
  camp_registration_confirmation: "Tábor — visszaigazolás (vásárló)",
}
