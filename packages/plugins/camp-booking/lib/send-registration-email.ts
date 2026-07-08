import { logMailer } from "@wse/core/lib/mailer-log"
import { MailerService } from "@wse/core/services/mailer"
import type { ICampRegistration } from "../models/CampRegistration"

export async function sendCampRegistrationConfirmationEmail(
  registration: Pick<
    ICampRegistration,
    | "_id"
    | "buyerName"
    | "buyerEmail"
    | "campTitle"
    | "sessionLabel"
    | "ticketTypeName"
    | "childCount"
    | "totalHuf"
  >
) {
  const registrationId = String(registration._id)
  try {
    await MailerService.sendEmail({
      to: registration.buyerEmail,
      templateType: "camp_registration_confirmation",
      data: {
        buyerName: registration.buyerName,
        buyerEmail: registration.buyerEmail,
        campTitle: registration.campTitle,
        sessionLabel: registration.sessionLabel,
        ticketTypeName: registration.ticketTypeName,
        childCount: registration.childCount,
        totalHuf: registration.totalHuf.toLocaleString("hu-HU"),
        registrationId,
      },
      logContext: {
        flow: "camp_registration_confirmation",
        registrationId,
        pluginId: "camp-booking",
      },
    })
  } catch (error) {
    logMailer("error", "camp_registration_confirmation_failed", {
      registrationId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
