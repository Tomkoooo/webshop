import Link from "next/link"
import { resolveSiteContactChannels } from "@wse/core/lib/site-contact"
import { hasContactFieldValue } from "@wse/core/lib/contact-display"
import { ShopContentService } from "@wse/core/services/shop-content"
import { ContactEmailsService } from "@wse/core/services/contact-emails"

/** Admin: where each contact channel is configured (emails = single source of truth). */
export async function SiteContactChannelsPanel() {
  const [shopContent, contactEmails, invoiceErrorAlertEmails, newOrderNotificationEmails] = await Promise.all([
    ShopContentService.getAll(),
    ContactEmailsService.list(),
    ContactEmailsService.listInvoiceErrorAlertEmails(),
    ContactEmailsService.listNewOrderNotificationEmails(),
  ])
  const channels = resolveSiteContactChannels(shopContent)

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-4 space-y-4 text-sm">
      <p className="text-neutral-400">
        Az <strong className="text-white">e-mail címek</strong> csak itt (alább) szerkeszthetők — a weboldal, lábléc és
        kapcsolat űrlap innen veszi őket. A telefon és cím továbbra is a bolt alapadataiból vagy a főoldal
        kapcsolat szekciójából jön (lásd lent).
      </p>

      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-300">
          E-mailek (egyetlen forrás)
        </h3>
        {contactEmails.length > 0 ? (
          <ul className="space-y-1 text-neutral-300">
            {contactEmails.map((entry) => (
              <li key={entry.id}>
                <span className="text-neutral-500">{entry.label}:</span> {entry.email}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-amber-200/90 text-xs">Még nincs e-mail cím — add hozzá alább.</p>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-white/10">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-300/90">
          Új rendelés értesítések
        </h3>
        {newOrderNotificationEmails.length > 0 ? (
          <ul className="space-y-1 text-neutral-300">
            {newOrderNotificationEmails.map((email) => (
              <li key={email}>{email}</li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-500 text-xs">
            Nincs beállítva — sikeres rendeléskor nem küldünk külön belső értesítőt.
          </p>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-white/10">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-300/90">
          Számlázási hiba értesítések
        </h3>
        {invoiceErrorAlertEmails.length > 0 ? (
          <ul className="space-y-1 text-neutral-300">
            {invoiceErrorAlertEmails.map((email) => (
              <li key={email}>{email}</li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-500 text-xs">
            Nincs külön cím — automatikus számlázási hibáknál az első kapcsolati e-mail (vagy{" "}
            <code className="text-neutral-600">INVOICE_ERROR_ALERT_EMAIL</code>) kapja az üzenetet.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/10">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
            Telefon (megjelenítés)
          </h3>
          <p className="text-neutral-300">
            {hasContactFieldValue(channels.phone) ? channels.phone : "— nincs beállítva"}
          </p>
          <p className="text-[10px] text-neutral-600 mt-1">
            Alap: ShopContent <code className="text-neutral-500">contact_phone</code> · felülírható a főoldal
            kapcsolat blokkjában
          </p>
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
            Cím (megjelenítés)
          </h3>
          <p className="text-neutral-300">
            {hasContactFieldValue(channels.address) ? channels.address : "— nincs beállítva"}
          </p>
          <p className="text-[10px] text-neutral-600 mt-1">
            Alap: ShopContent <code className="text-neutral-500">contact_address</code> · felülírható a főoldal
            kapcsolat blokkjában
          </p>
        </div>
      </div>

      <p className="text-[10px] text-neutral-600">
        Régi CMS „email” mezők a főoldalon már nem használatosak megjelenítésre.{" "}
        <Link href="/admin/cms" className="text-violet-300 hover:underline">
          CMS oldalak
        </Link>{" "}
        — telefon / cím szerkesztése a kapcsolat szekcióban.
      </p>
    </div>
  )
}
