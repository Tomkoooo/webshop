import type { EmailTemplateSeed } from "@wse/core/services/email-template"

/** tBook plugin mails — separate from webshop `order_confirmation`. */
export function buildTBookEmailTemplateSeeds(brandName: string): EmailTemplateSeed[] {
  return [
    {
      type: "t_book_booking_confirmation",
      pluginId: "t-book",
      tags: ["t-book", "transactional", "booking"],
      subject: `${brandName} — foglalás visszaigazolása ({{eventName}})`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1>Köszönjük a foglalást!</h1>
          <p>Kedves {{customerName}},</p>
          <p>Megkaptuk a fizetést a következő foglaláshoz:</p>
          <div style="background:#f4f4f4;padding:15px;margin:20px 0;">
            <p><strong>Esemény:</strong> {{eventName}}</p>
            <p><strong>Létszám:</strong> {{guests}} fő</p>
            <p><strong>Szállás:</strong> {{hotelName}}</p>
            <p><strong>Éjszakák:</strong> {{nights}}</p>
            <p><strong>Fizetett összeg:</strong> {{totalHuf}} Ft</p>
          </div>
          <p>Foglalás azonosító: {{bookingId}}</p>
          <p style="font-size:12px;color:#666;">Ez egy automatikus üzenet. A számlát külön e-mailben küldjük.</p>
        </div>
      `,
      description:
        "tBook plugin — vásárló e-mail sikeres Stripe fizetés után. Nem a webshop order_confirmation sablon.",
      variables: [
        "customerName",
        "customerEmail",
        "eventName",
        "hotelName",
        "guests",
        "nights",
        "totalHuf",
        "bookingId",
      ],
    },
  ]
}
