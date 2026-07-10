import Link from "next/link"
import { resolveSiteContactChannels } from "@wse/core/lib/site-contact"
import { hasContactFieldValue } from "@wse/core/lib/contact-display"
import { ShopContentService } from "@wse/core/services/shop-content"
import { ContactEmailsService } from "@wse/core/services/contact-emails"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"

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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Kapcsolati csatornák áttekintése</CardTitle>
        <CardDescription>
          Az <strong>e-mail címek</strong> csak alább szerkeszthetők — a weboldal, lábléc és kapcsolat űrlap innen
          veszi őket. A telefon és cím a bolt alapadataiból vagy a főoldal kapcsolat szekciójából jön.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">E-mailek</h3>
          {contactEmails.length > 0 ? (
            <ul className="space-y-1 text-muted-foreground">
              {contactEmails.map((entry) => (
                <li key={entry.id}>
                  <span className="text-foreground">{entry.label}:</span> {entry.email}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-amber-800">Még nincs e-mail cím — add hozzá alább.</p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Új rendelés értesítések</h3>
          {newOrderNotificationEmails.length > 0 ? (
            <ul className="space-y-1 text-muted-foreground">
              {newOrderNotificationEmails.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nincs beállítva — sikeres rendeléskor nem küldünk külön belső értesítőt.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Számlázási hiba értesítések</h3>
          {invoiceErrorAlertEmails.length > 0 ? (
            <ul className="space-y-1 text-muted-foreground">
              {invoiceErrorAlertEmails.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nincs külön cím — automatikus számlázási hibáknál az első kapcsolati e-mail kapja az üzenetet.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
          <div>
            <h3 className="mb-1 font-medium text-foreground">Telefon (megjelenítés)</h3>
            <p className="text-muted-foreground">
              {hasContactFieldValue(channels.phone) ? channels.phone : "— nincs beállítva"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Alap: bolt beállítások · felülírható a főoldal kapcsolat blokkjában
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-foreground">Cím (megjelenítés)</h3>
            <p className="text-muted-foreground">
              {hasContactFieldValue(channels.address) ? channels.address : "— nincs beállítva"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Alap: bolt beállítások · felülírható a főoldal kapcsolat blokkjában
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground md:col-span-2">
          Régi CMS „email” mezők a főoldalon már nem használatosak megjelenítésre.{" "}
          <Link href="/admin/cms" className="text-primary font-medium hover:underline">
            CMS oldalak
          </Link>{" "}
          — telefon / cím szerkesztése a kapcsolat szekcióban.
        </p>
      </CardContent>
    </Card>
  )
}
