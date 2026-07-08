import dbConnect from "@wse/core/lib/db"
import PopupCampaignModel from "@wse/core/models/PopupCampaign"
import {
  DEFAULT_POPUP_CAMPAIGN_INPUT,
  popupCampaignInputSchema,
  popupCampaignSchema,
  popupTemplateIdSchema,
  type PopupCampaign,
  type PopupCampaignInput,
} from "@wse/core/lib/popup-campaign-schema"

function docToCampaign(doc: {
  _id: unknown
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
}): PopupCampaign {
  const templateParsed = popupTemplateIdSchema.safeParse(doc.templateId)
  return popupCampaignSchema.parse({
    id: String(doc._id),
    name: doc.name,
    enabled: doc.enabled,
    priority: doc.priority,
    templateId: templateParsed.success ? templateParsed.data : "centered",
    title: doc.title,
    body: doc.body,
    imageUrl: doc.imageUrl,
    buttonText: doc.buttonText,
    buttonHref: doc.buttonHref,
    showCloseButton: doc.showCloseButton,
    targetPaths: doc.targetPaths,
  })
}

export class PopupCampaignService {
  static async list(): Promise<PopupCampaign[]> {
    await dbConnect()
    const docs = await PopupCampaignModel.find({}).sort({ priority: 1, createdAt: 1 }).lean()
    return docs.map((d) => docToCampaign(d as Parameters<typeof docToCampaign>[0]))
  }

  static async getById(id: string): Promise<PopupCampaign | null> {
    await dbConnect()
    const doc = await PopupCampaignModel.findById(id).lean()
    if (!doc) return null
    return docToCampaign(doc as Parameters<typeof docToCampaign>[0])
  }

  static async create(input?: Partial<PopupCampaignInput>): Promise<PopupCampaign> {
    await dbConnect()
    const parsed = popupCampaignInputSchema.parse({
      ...DEFAULT_POPUP_CAMPAIGN_INPUT,
      ...input,
    })
    const doc = await PopupCampaignModel.create(parsed)
    return docToCampaign(doc.toObject() as Parameters<typeof docToCampaign>[0])
  }

  static async update(id: string, input: Partial<PopupCampaignInput>): Promise<PopupCampaign | null> {
    await dbConnect()
    const current = await this.getById(id)
    if (!current) return null
    const merged = popupCampaignInputSchema.parse({
      name: current.name,
      enabled: current.enabled,
      priority: current.priority,
      templateId: current.templateId,
      title: current.title,
      body: current.body,
      imageUrl: current.imageUrl,
      buttonText: current.buttonText,
      buttonHref: current.buttonHref,
      showCloseButton: current.showCloseButton,
      targetPaths: current.targetPaths,
      ...input,
    })
    const doc = await PopupCampaignModel.findByIdAndUpdate(id, { $set: merged }, { new: true }).lean()
    if (!doc) return null
    return docToCampaign(doc as Parameters<typeof docToCampaign>[0])
  }

  static async delete(id: string): Promise<boolean> {
    await dbConnect()
    const result = await PopupCampaignModel.findByIdAndDelete(id)
    return Boolean(result)
  }

  static async getActiveForStorefront(): Promise<PopupCampaign[]> {
    await dbConnect()
    const docs = await PopupCampaignModel.find({ enabled: true })
      .sort({ priority: 1, createdAt: 1 })
      .lean()
    return docs.map((d) => docToCampaign(d as Parameters<typeof docToCampaign>[0]))
  }
}
