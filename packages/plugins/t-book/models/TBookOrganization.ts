import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { VoucherPdfLayout } from "../lib/voucher-pdf-layout"

export type TBookOrganizationStatus = "active" | "suspended"

export type TBookOrgStripeSettings = {
  enabled: boolean
  /** AES-encrypted Stripe secret key */
  secretKeyEnc: string
  /** AES-encrypted webhook signing secret */
  webhookSecretEnc: string
  publishableKey: string
}

export type TBookOrgSmtpSettings = {
  host: string
  port: number
  user: string
  passEnc: string
  fromEmail: string
  fromName: string
}

export type TBookOrgSzamlazzSettings = {
  enabled: boolean
  agentKeyEnc: string
  sellerName: string
  sellerBank: string
  sellerBankAccount: string
  vatPercent: number
}

export type TBookOrgEmailTemplateOverride = {
  subject: string
  body: string
}

export type TBookOrgEmailTemplates = {
  bookingConfirmation?: TBookOrgEmailTemplateOverride | null
  voucherDelivery?: TBookOrgEmailTemplateOverride | null
  /** Guest email when the Számlázz.hu invoice PDF is sent. */
  invoiceSent?: TBookOrgEmailTemplateOverride | null
}

export interface ITBookOrganizationSettings {
  currency: string
  stripe?: TBookOrgStripeSettings
  smtp?: TBookOrgSmtpSettings
  szamlazz?: TBookOrgSzamlazzSettings
  emailTemplates?: TBookOrgEmailTemplates
  voucherPdfLayout?: VoucherPdfLayout
}

export interface ITBookOrganization extends Document {
  name: string
  slug: string
  status: TBookOrganizationStatus
  settings: ITBookOrganizationSettings
  createdBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const StripeSettingsSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    secretKeyEnc: { type: String, default: "" },
    webhookSecretEnc: { type: String, default: "" },
    publishableKey: { type: String, default: "" },
  },
  { _id: false }
)

const SmtpSettingsSchema = new Schema(
  {
    host: { type: String, default: "" },
    port: { type: Number, default: 587 },
    user: { type: String, default: "" },
    passEnc: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    fromName: { type: String, default: "" },
  },
  { _id: false }
)

const SzamlazzSettingsSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    agentKeyEnc: { type: String, default: "" },
    sellerName: { type: String, default: "" },
    sellerBank: { type: String, default: "" },
    sellerBankAccount: { type: String, default: "" },
    vatPercent: { type: Number, default: 27 },
  },
  { _id: false }
)

const EmailTemplateOverrideSchema = new Schema(
  {
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
  },
  { _id: false }
)

const TBookOrganizationSchema = new Schema<ITBookOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    settings: {
      currency: { type: String, default: "HUF" },
      stripe: { type: StripeSettingsSchema, default: undefined },
      smtp: { type: SmtpSettingsSchema, default: undefined },
      szamlazz: { type: SzamlazzSettingsSchema, default: undefined },
      emailTemplates: {
        bookingConfirmation: { type: EmailTemplateOverrideSchema, default: undefined },
        voucherDelivery: { type: EmailTemplateOverrideSchema, default: undefined },
        invoiceSent: { type: EmailTemplateOverrideSchema, default: undefined },
      },
      voucherPdfLayout: { type: Schema.Types.Mixed, default: undefined },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
)

const TBookOrganization: Model<ITBookOrganization> =
  mongoose.models.TBookOrganization ||
  mongoose.model<ITBookOrganization>("TBookOrganization", TBookOrganizationSchema)

export default TBookOrganization
