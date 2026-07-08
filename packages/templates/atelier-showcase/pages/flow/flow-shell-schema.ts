import { z } from "zod"

export const atelierFlowShellSchema = z.object({
  headline: z.string(),
  subhead: z.string().optional(),
})

export type AtelierFlowShellContent = z.infer<typeof atelierFlowShellSchema>
