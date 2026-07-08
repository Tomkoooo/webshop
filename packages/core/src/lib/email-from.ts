const DEFAULT_EMAIL_FROM = "no-reply@krausz.hu"
const DEFAULT_EMAIL_FROM_NAME = "Krausz Barkácsmester"

/** SMTP / nodemailer sender address (envelope From). */
export function getEmailFromAddress(): string {
  return String(process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM).trim() || DEFAULT_EMAIL_FROM
}

/** Display name shown in the recipient's inbox (not the address). */
export function getEmailFromName(): string {
  return String(process.env.EMAIL_FROM_NAME || DEFAULT_EMAIL_FROM_NAME).trim() || DEFAULT_EMAIL_FROM_NAME
}

/** RFC5322 From header, e.g. `"Shop Name" <no-reply@example.com>`. */
export function formatEmailFromHeader(): string {
  const name = getEmailFromName().replace(/"/g, "'")
  return `"${name}" <${getEmailFromAddress()}>`
}
