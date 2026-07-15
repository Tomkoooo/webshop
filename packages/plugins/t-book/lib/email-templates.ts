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
          <p style="font-size:12px;color:#666;">Ez egy automatikus üzenet. A számlát külön e-mailben küldjük. A belépőjegy(ek) PDF csatolmányban érkeznek külön e-mailben.</p>
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
    {
      type: "t_book_voucher_delivery",
      pluginId: "t-book",
      tags: ["t-book", "transactional", "voucher"],
      subject: `${brandName} — belépőjegy ({{eventName}})`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1>Belépőjegy(ek)</h1>
          <p>Kedves {{customerName}},</p>
          <p>Mellékelten küldjük a(z) <strong>{{eventName}}</strong> esemény belépőjegyét ({{voucherCount}} db).</p>
          <div style="background:#f4f4f4;padding:15px;margin:20px 0;">
            <p><strong>Esemény:</strong> {{eventName}}</p>
            <p><strong>Létszám:</strong> {{guests}} fő</p>
            <p><strong>Foglalás azonosító:</strong> {{bookingId}}</p>
          </div>
          <p>Az esemény napján mutassa be a PDF-ben található QR-kódot a beléptetésnél. Minden résztvevőnek saját QR-kódja van.</p>
          <p style="font-size:12px;color:#666;">Ez egy automatikus üzenet. Kérjük, ne válaszoljon erre az e-mailre.</p>
        </div>
      `,
      description: "tBook plugin — belépőjegy PDF csatolmány sikeres fizetés után.",
      variables: [
        "customerName",
        "customerEmail",
        "eventName",
        "guests",
        "voucherCount",
        "bookingId",
      ],
    },
  ]
}
