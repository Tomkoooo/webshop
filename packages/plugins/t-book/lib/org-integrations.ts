import "server-only"

import nodemailer from "nodemailer"
import handlebars from "handlebars"
import mongoose from "mongoose"
import Stripe from "stripe"
import dbConnect from "@wse/core/lib/db"
import EmailTemplate from "@wse/core/models/EmailTemplate"
import { STRIPE_API_VERSION, getStripeClient, getStripeWebhookSecret } from "@wse/core/services/stripe"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import TBookOrganization, { type ITBookOrganization } from "../models/TBookOrganization"
import { decryptOrgSecret } from "./org-secrets"

function oid(id: string) {
  return id
}

export async function loadOrganization(organizationId: string): Promise<ITBookOrganization | null> {
  await dbConnect()
  return TBookOrganization.findById(oid(organizationId)).lean<ITBookOrganization>()
}

export async function getOrgStripeClient(organizationId: string | null | undefined): Promise<Stripe> {
  if (!organizationId) return getStripeClient()
  const org = await loadOrganization(organizationId)
  const secret = decryptOrgSecret(org?.settings?.stripe?.secretKeyEnc)
  if (org?.settings?.stripe?.enabled && secret) {
    return new Stripe(secret, { apiVersion: STRIPE_API_VERSION })
  }
  // Fallback to platform env for orgs that have not configured Stripe yet.
  return getStripeClient()
}

export async function assertOrgStripeReady(organizationId: string | null | undefined): Promise<void> {
  const platformEnabled = await FeatureFlagService.isEnabled("stripePayments", false)
  if (!organizationId) {
    if (!platformEnabled) throw new Error("A Stripe fizetés jelenleg nem elérhető.")
    return
  }
  const org = await loadOrganization(organizationId)
  const secret = decryptOrgSecret(org?.settings?.stripe?.secretKeyEnc)
  if (org?.settings?.stripe?.enabled && secret) return
  if (platformEnabled && process.env.STRIPE_SECRET_KEY?.trim()) return
  throw new Error("A szervezethez nincs beállítva Stripe kulcs. Add meg a Szervezet beállításokban.")
}

export async function resolveStripeWebhookSecretForSignature(
  rawBody: string,
  signature: string
): Promise<{ event: Stripe.Event; organizationId: string | null }> {
  const platformSecret = (() => {
    try {
      return getStripeWebhookSecret()
    } catch {
      return ""
    }
  })()

  if (platformSecret) {
    try {
      const stripe = getStripeClient()
      const event = stripe.webhooks.constructEvent(rawBody, signature, platformSecret)
      return { event, organizationId: null }
    } catch {
      // Platform secret rejected — try per-org Stripe accounts below.
    }
  }

  try {
    await dbConnect()
    // Avoid hanging queries when mongoose is not actually connected (unit tests / misconfig).
    if (mongoose.connection.readyState === 1) {
      const orgs = await TBookOrganization.find({
        "settings.stripe.enabled": true,
        "settings.stripe.webhookSecretEnc": { $nin: [null, ""] },
      })
        .select("_id settings.stripe")
        .lean<ITBookOrganization[]>()

      for (const org of orgs) {
        const secret = decryptOrgSecret(org.settings?.stripe?.webhookSecretEnc)
        const key = decryptOrgSecret(org.settings?.stripe?.secretKeyEnc)
        if (!secret || !key) continue
        try {
          const stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION })
          const event = stripe.webhooks.constructEvent(rawBody, signature, secret)
          return { event, organizationId: String(org._id) }
        } catch {
          // next org
        }
      }
    }
  } catch {
    // DB unavailable — fall through to signature failure.
  }

  throw new Error("Stripe webhook signature verification failed")
}

export type OrgSmtpConfig = {
  host: string
  port: number
  user: string
  pass: string
  fromEmail: string
  fromName: string
}

export async function resolveOrgSmtp(
  organizationId: string | null | undefined
): Promise<OrgSmtpConfig | null> {
  if (!organizationId) return null
  const org = await loadOrganization(organizationId)
  const smtp = org?.settings?.smtp
  if (!smtp?.host?.trim() || !smtp.fromEmail?.trim()) return null
  return {
    host: smtp.host.trim(),
    port: Number(smtp.port) || 587,
    user: smtp.user?.trim() || "",
    pass: decryptOrgSecret(smtp.passEnc),
    fromEmail: smtp.fromEmail.trim(),
    fromName: smtp.fromName?.trim() || org?.name || "",
  }
}

export async function sendOrgTemplatedEmail(opts: {
  organizationId: string | null | undefined
  to: string
  templateType:
    | "t_book_booking_confirmation"
    | "t_book_voucher_delivery"
    | "t_book_invoice_sent"
  data: Record<string, unknown>
  attachments?: { filename: string; content: Buffer; contentType?: string }[]
}): Promise<void> {
  await dbConnect()

  let subject = ""
  let body = ""

  if (opts.organizationId) {
    const org = await loadOrganization(opts.organizationId)
    const override =
      opts.templateType === "t_book_booking_confirmation"
        ? org?.settings?.emailTemplates?.bookingConfirmation
        : org?.settings?.emailTemplates?.voucherDelivery
    if (override?.subject?.trim() && override?.body?.trim()) {
      subject = override.subject
      body = override.body
    }
  }

  if (!subject || !body) {
    const template = await EmailTemplate.findOne({ type: opts.templateType }).lean()
    if (template?.subject?.trim() && template?.body?.trim()) {
      subject = template.subject
      body = template.body
    } else {
      const { buildTBookEmailTemplateSeeds } = await import("./email-templates")
      const seed = buildTBookEmailTemplateSeeds("tBook").find((t) => t.type === opts.templateType)
      if (!seed) throw new Error(`Email template not found: ${opts.templateType}`)
      subject = seed.subject
      body = seed.body
    }
  }

  const compiledSubject = handlebars.compile(subject)(opts.data)
  const compiledBody = handlebars.compile(body)(opts.data)

  const orgSmtp = await resolveOrgSmtp(opts.organizationId)
  if (orgSmtp) {
    const transporter = nodemailer.createTransport({
      host: orgSmtp.host,
      port: orgSmtp.port,
      secure: orgSmtp.port === 465,
      auth: orgSmtp.user ? { user: orgSmtp.user, pass: orgSmtp.pass } : undefined,
    })
    const from = orgSmtp.fromName
      ? `"${orgSmtp.fromName}" <${orgSmtp.fromEmail}>`
      : orgSmtp.fromEmail
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: compiledSubject,
      html: compiledBody,
      attachments: opts.attachments,
    })
    return
  }

  // Platform SMTP, but keep the (possibly org-overridden) compiled body.
  const { MailerService } = await import("@wse/core/services/mailer")
  const { formatEmailFromHeader } = await import("@wse/core/lib/email-from")
  const transporter = await MailerService.getTransporter()
  await transporter.sendMail({
    from: formatEmailFromHeader(),
    to: opts.to,
    subject: compiledSubject,
    html: compiledBody,
    attachments: opts.attachments,
  })
}

export async function resolveOrgSzamlazz(organizationId: string | null | undefined) {
  if (!organizationId) return null
  const org = await loadOrganization(organizationId)
  const s = org?.settings?.szamlazz
  if (!s?.enabled) return null
  const agentKey = decryptOrgSecret(s.agentKeyEnc)
  if (!agentKey) return null
  return {
    agentKey,
    sellerName: s.sellerName || "",
  }
}
