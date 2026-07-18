import type { EmailTemplateSeed } from "@wse/core/services/email-template"

/** tBook plugin mails — separate from webshop `order_confirmation`. */
export function buildTBookEmailTemplateSeeds(brandName: string): EmailTemplateSeed[] {
  return [
    {
      type: "t_book_booking_confirmation",
      pluginId: "t-book",
      tags: ["t-book", "transactional", "booking"],
      subject: `${brandName} — booking confirmation ({{eventName}})`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1>Thank you for your booking!</h1>
          <p>Dear {{customerName}},</p>
          <p>We have received payment for the following booking:</p>
          <div style="background:#f4f4f4;padding:15px;margin:20px 0;">
            <p><strong>Event:</strong> {{eventName}}</p>
            <p><strong>Guests:</strong> {{guests}}</p>
            <p><strong>Hotel:</strong> {{hotelName}}</p>
            <p><strong>Nights:</strong> {{nights}}</p>
            <p><strong>Amount paid:</strong> {{total}}</p>
          </div>
          <p>Booking ID: {{bookingId}}</p>
          <p style="font-size:12px;color:#666;">This is an automated message. Your invoice will be sent in a separate email. Entry PDF(s) will arrive in another email.</p>
        </div>
      `,
      description:
        "tBook plugin — customer email after successful Stripe payment. Not the webshop order_confirmation template.",
      variables: [
        "customerName",
        "customerEmail",
        "eventName",
        "hotelName",
        "guests",
        "nights",
        "total",
        "totalHuf",
        "currency",
        "bookingId",
      ],
    },
    {
      type: "t_book_voucher_delivery",
      pluginId: "t-book",
      tags: ["t-book", "transactional", "voucher"],
      subject: `${brandName} — entry ({{eventName}})`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1>Your entries</h1>
          <p>Dear {{customerName}},</p>
          <p>Please find attached your entry PDF(s) for <strong>{{eventName}}</strong> ({{voucherCount}}).</p>
          <div style="background:#f4f4f4;padding:15px;margin:20px 0;">
            <p><strong>Event:</strong> {{eventName}}</p>
            <p><strong>Guests:</strong> {{guests}}</p>
            <p><strong>Booking ID:</strong> {{bookingId}}</p>
          </div>
          <p>Please present the QR code in the PDF at check-in on the event day. Each participant has their own QR code.</p>
          <p style="font-size:12px;color:#666;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
      description: "tBook plugin — entry PDF attachment after successful payment.",
      variables: [
        "customerName",
        "customerEmail",
        "eventName",
        "guests",
        "voucherCount",
        "bookingId",
      ],
    },
    {
      type: "t_book_invoice_sent",
      pluginId: "t-book",
      tags: ["t-book", "transactional", "invoice"],
      subject: `${brandName} — invoice ({{eventName}})`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1>Invoice</h1>
          <p>Dear {{customerName}},</p>
          <p>Please find attached the invoice for your <strong>{{eventName}}</strong> booking.</p>
          <div style="background:#f4f4f4;padding:15px;margin:20px 0;">
            <p><strong>Event:</strong> {{eventName}}</p>
            <p><strong>Amount paid:</strong> {{total}}</p>
            <p><strong>Booking ID:</strong> {{bookingId}}</p>
            <p><strong>Invoice ID:</strong> {{invoiceId}}</p>
          </div>
          <p style="font-size:12px;color:#666;">This is an automated message. Entry ticket(s) are sent in a separate email.</p>
        </div>
      `,
      description: "tBook plugin — invoice PDF attachment after successful Számlázz.hu issue.",
      variables: [
        "customerName",
        "customerEmail",
        "eventName",
        "guests",
        "total",
        "totalHuf",
        "currency",
        "bookingId",
        "invoiceId",
      ],
    },
  ]
}
