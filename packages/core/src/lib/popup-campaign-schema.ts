import { z } from "zod"

export const popupTemplateIdSchema = z.enum(["centered", "imageTop", "split"])

export type PopupTemplateId = z.infer<typeof popupTemplateIdSchema>

export const popupCampaignInputSchema = z.object({
  name: z.string().min(1).max(120),
  enabled: z.boolean(),
  priority: z.number().int().min(0).max(9999),
  templateId: popupTemplateIdSchema,
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  imageUrl: z.string().max(500).optional(),
  buttonText: z.string().max(80).optional(),
  buttonHref: z.string().max(500).optional(),
  showCloseButton: z.boolean(),
  targetPaths: z.array(z.string().min(1).max(500)).min(1).max(50),
})

export type PopupCampaignInput = z.infer<typeof popupCampaignInputSchema>

export const popupCampaignSchema = popupCampaignInputSchema.extend({
  id: z.string().min(1),
})

export type PopupCampaign = z.infer<typeof popupCampaignSchema>

export const DEFAULT_POPUP_CAMPAIGN_INPUT: PopupCampaignInput = {
  name: "Új popup",
  enabled: false,
  priority: 100,
  templateId: "centered",
  showCloseButton: true,
  targetPaths: ["/"],
}

export const POPUP_TEMPLATE_OPTIONS: Array<{
  id: PopupTemplateId
  label: string
  description: string
}> = [
  {
    id: "centered",
    label: "Középre",
    description: "Kép (opcionális) felül, szöveg és gomb középen.",
  },
  {
    id: "imageTop",
    label: "Kép felül",
    description: "Teljes szélességű kép, tartalom alatta.",
  },
  {
    id: "split",
    label: "Oszlopos",
    description: "Asztali nézetben kép és szöveg egymás mellett.",
  },
]
