import { z } from "zod"

export const defaultModernFlowShellSchema = z.object({
  headline: z.string(),
  subhead: z.string().optional(),
})

export type DefaultModernFlowShellContent = z.infer<typeof defaultModernFlowShellSchema>
