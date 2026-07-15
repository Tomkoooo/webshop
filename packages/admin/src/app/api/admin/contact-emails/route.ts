import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { ContactEmailsService } from "@wse/core/services/contact-emails"
import { revalidatePath } from "next/cache"

const entrySchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  email: z.string().email(),
})

const schema = z.object({
  entries: z.array(entrySchema),
  invoiceErrorAlertEmails: z.array(z.string().email()).optional(),
  newOrderNotificationEmails: z.array(z.string().email()).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET() {
  await requireAdmin()
  const [entries, invoiceErrorAlertEmails, newOrderNotificationEmails, displayChannels] =
    await Promise.all([
      ContactEmailsService.list(),
      ContactEmailsService.listInvoiceErrorAlertEmails(),
      ContactEmailsService.listNewOrderNotificationEmails(),
      ContactEmailsService.getDisplayChannels(),
    ])
  return NextResponse.json({
    entries,
    invoiceErrorAlertEmails,
    newOrderNotificationEmails,
    phone: displayChannels.phone,
    address: displayChannels.address,
  })
}

export async function PUT(request: Request) {
  await requireAdmin()
  const { entries, invoiceErrorAlertEmails, newOrderNotificationEmails, phone, address } =
    schema.parse(await request.json())
  const saved = await ContactEmailsService.save(entries)
  const savedInvoiceAlerts =
    invoiceErrorAlertEmails !== undefined ?
      await ContactEmailsService.saveInvoiceErrorAlertEmails(invoiceErrorAlertEmails)
    : await ContactEmailsService.listInvoiceErrorAlertEmails()
  const savedNewOrderNotifications =
    newOrderNotificationEmails !== undefined ?
      await ContactEmailsService.saveNewOrderNotificationEmails(newOrderNotificationEmails)
    : await ContactEmailsService.listNewOrderNotificationEmails()
  const savedDisplayChannels =
    phone !== undefined || address !== undefined ?
      await ContactEmailsService.saveDisplayChannels({
        phone: phone ?? "",
        address: address ?? "",
      })
    : await ContactEmailsService.getDisplayChannels()
  revalidatePath("/", "layout")
  return NextResponse.json({
    entries: saved,
    invoiceErrorAlertEmails: savedInvoiceAlerts,
    newOrderNotificationEmails: savedNewOrderNotifications,
    phone: savedDisplayChannels.phone,
    address: savedDisplayChannels.address,
  })
}
