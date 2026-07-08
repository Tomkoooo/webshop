import mongoose, { Schema, Document, Model } from "mongoose"

export interface IPopupCampaign extends Document {
  name: string
  enabled: boolean
  priority: number
  templateId: string
  title?: string
  body?: string
  imageUrl?: string
  buttonText?: string
  buttonHref?: string
  showCloseButton: boolean
  targetPaths: string[]
}

const PopupCampaignSchema = new Schema<IPopupCampaign>(
  {
    name: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    priority: { type: Number, default: 100 },
    templateId: { type: String, default: "centered" },
    title: { type: String },
    body: { type: String },
    imageUrl: { type: String },
    buttonText: { type: String },
    buttonHref: { type: String },
    showCloseButton: { type: Boolean, default: true },
    targetPaths: { type: [String], default: ["/"] },
  },
  { timestamps: true }
)

PopupCampaignSchema.index({ enabled: 1, priority: 1 })

const PopupCampaign: Model<IPopupCampaign> =
  mongoose.models.PopupCampaign ||
  mongoose.model<IPopupCampaign>("PopupCampaign", PopupCampaignSchema)

export default PopupCampaign
