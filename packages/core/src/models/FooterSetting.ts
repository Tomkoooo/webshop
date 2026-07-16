import mongoose, { Document, Model, Schema } from "mongoose"

type SocialPlatform = "facebook" | "instagram" | "twitter" | "youtube"

export interface IFooterSetting extends Document {
  key: string
  tagline: string
  quickLinksTitle: string
  quickLinks: Array<{ label: string; href: string }>
  categoriesTitle: string
  browseProductsLabel: string
  contactTitle: string
  newsletterLabel: string
  newsletterPlaceholder: string
  copyrightText: string
  socialLinks: Array<{ platform: SocialPlatform; enabled: boolean; url: string }>
  contactEntries: Array<{ label: string; value: string; kind: "text" | "link" | "mailto" | "tel" }>
  organizerSection: {
    title: string
    companyName: string
    registeredAddress: string
    mailingAddress: string
    openingHours: string
    taxNumber: string
  }
  paymentMethodsNote: string
}

const FooterSettingSchema = new Schema<IFooterSetting>(
  {
    key: { type: String, required: true, unique: true, default: "footer" },
    tagline: { type: String, default: "Minőségi termékek, gyors szállítás." },
    quickLinksTitle: { type: String, default: "Linkek" },
    quickLinks: {
      type: [
        {
          label: { type: String, required: true },
          href: { type: String, required: true },
        },
      ],
      default: [],
    },
    categoriesTitle: { type: String, default: "Kategóriák" },
    browseProductsLabel: { type: String, default: "Termékek böngészése" },
    contactTitle: { type: String, default: "Kapcsolat" },
    newsletterLabel: { type: String, default: "Hírlevél" },
    newsletterPlaceholder: { type: String, default: "E-mail cím" },
    copyrightText: { type: String, default: "© {year} {brand}. Minden jog fenntartva." },
    socialLinks: {
      type: [
        {
          platform: { type: String, enum: ["facebook", "instagram", "twitter", "youtube"], required: true },
          enabled: { type: Boolean, default: true },
          url: { type: String, default: "" },
        },
      ],
      default: [],
    },
    contactEntries: {
      type: [
        {
          label: { type: String, default: "" },
          value: { type: String, default: "" },
          kind: { type: String, enum: ["text", "link", "mailto", "tel"], default: "text" },
        },
      ],
      default: [],
    },
    organizerSection: {
      type: {
        title: { type: String, default: "" },
        companyName: { type: String, default: "" },
        registeredAddress: { type: String, default: "" },
        mailingAddress: { type: String, default: "" },
        openingHours: { type: String, default: "" },
        taxNumber: { type: String, default: "" },
      },
      default: () => ({
        title: "",
        companyName: "",
        registeredAddress: "",
        mailingAddress: "",
        openingHours: "",
        taxNumber: "",
      }),
    },
    paymentMethodsNote: { type: String, default: "" },
  },
  { timestamps: true }
)

const FooterSetting: Model<IFooterSetting> =
  mongoose.models.FooterSetting || mongoose.model<IFooterSetting>("FooterSetting", FooterSettingSchema)

export default FooterSetting
