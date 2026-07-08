import mongoose, { Schema, Document, Model } from "mongoose"

export type PressKitAccessMode = "shared_password" | "password_per_contact" | "unique_link"

export type PressKitPdfSettings = {
  allowDownload: boolean
  watermarkTemplate: string
  disableTextSelection: boolean
  showPageNav: boolean
}

export type PressKitSection = {
  id: string
  title: string
  bodyHtml: string
}

export type PressKitHighlight = {
  label: string
  detail: string
}

export interface IPressKitSettings extends Document {
  singletonKey: string
  accessMode: PressKitAccessMode
  sharedPasswordHash?: string
  pageTitle: string
  heroImage?: string
  embargoNote?: string
  sections: PressKitSection[]
  productHighlights: PressKitHighlight[]
  /** Visual CMS block document (preferred). Legacy flat fields kept in sync on save. */
  pageBlocks?: unknown[]
  pdfMediaFilename?: string
  pdfSettings: PressKitPdfSettings
  isPublished: boolean
  publishedAt?: Date | null
}

const PressKitSectionSchema = new Schema<PressKitSection>(
  {
    id: { type: String, required: true },
    title: { type: String, default: "" },
    bodyHtml: { type: String, default: "" },
  },
  { _id: false }
)

const PressKitHighlightSchema = new Schema<PressKitHighlight>(
  {
    label: { type: String, default: "" },
    detail: { type: String, default: "" },
  },
  { _id: false }
)

const PressKitPdfSettingsSchema = new Schema<PressKitPdfSettings>(
  {
    allowDownload: { type: Boolean, default: false },
    watermarkTemplate: { type: String, default: "{{outlet}} — {{email}}" },
    disableTextSelection: { type: Boolean, default: true },
    showPageNav: { type: Boolean, default: true },
  },
  { _id: false }
)

const PressKitSettingsSchema = new Schema<IPressKitSettings>(
  {
    singletonKey: { type: String, required: true, unique: true, default: "default" },
    accessMode: {
      type: String,
      enum: ["shared_password", "password_per_contact", "unique_link"],
      default: "unique_link",
    },
    sharedPasswordHash: { type: String },
    pageTitle: { type: String, default: "Sajtóanyagok" },
    heroImage: { type: String },
    embargoNote: { type: String, default: "" },
    sections: { type: [PressKitSectionSchema], default: [] },
    productHighlights: { type: [PressKitHighlightSchema], default: [] },
    pageBlocks: { type: [Schema.Types.Mixed], default: [] },
    pdfMediaFilename: { type: String },
    pdfSettings: { type: PressKitPdfSettingsSchema, default: () => ({}) },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const PressKitSettings: Model<IPressKitSettings> =
  mongoose.models.PressKitSettings ||
  mongoose.model<IPressKitSettings>("PressKitSettings", PressKitSettingsSchema)

export default PressKitSettings
