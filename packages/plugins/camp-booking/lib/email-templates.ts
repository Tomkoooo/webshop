import type { EmailTemplateSeed } from "@wse/core/services/email-template"

/** Camp-booking plugin mails — separate from webshop `order_confirmation`. */
export function buildCampBookingEmailTemplateSeeds(brandName: string): EmailTemplateSeed[] {
  return [
    {
      type: "camp_registration_confirmation",
      pluginId: "camp-booking",
      tags: ["camp-booking", "transactional", "registration"],
      subject: `${brandName} — tábor jelentkezés visszaigazolása ({{sessionLabel}})`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="text-transform:uppercase;">Köszönjük a jelentkezést!</h1>
          <p>Kedves {{buyerName}},</p>
          <p>Megkaptuk a fizetést a következő tábor jelentkezéshez:</p>
          <div style="background:#f4f4f4;padding:15px;margin:20px 0;">
            <p><strong>Tábor:</strong> {{campTitle}}</p>
            <p><strong>Turnus:</strong> {{sessionLabel}}</p>
            <p><strong>Jegytípus:</strong> {{ticketTypeName}}</p>
            <p><strong>Gyerekek száma:</strong> {{childCount}}</p>
            <p><strong>Fizetett összeg:</strong> {{totalHuf}} Ft</p>
          </div>
          <p>Regisztráció azonosító: {{registrationId}}</p>
          <p style="font-size:12px;color:#666;">Ez egy automatikus üzenet. Kérdés esetén írj a weboldal kapcsolatfelvételi űrlapján.</p>
        </div>
      `,
      description:
        "Tábor foglalás plugin — vásárló e-mail Stripe fizetés után. Nem a webshop order_confirmation sablon.",
      variables: [
        "buyerName",
        "buyerEmail",
        "campTitle",
        "sessionLabel",
        "ticketTypeName",
        "childCount",
        "totalHuf",
        "registrationId",
      ],
    },
  ]
}
