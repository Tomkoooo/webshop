import { z } from "zod"

export const contactSchema = z.object({
  hero: z.object({
    eyebrow: z.string().default("Begin a project — 003"),
    title: z.string().default("Tell us about your site."),
    subtitle: z
      .string()
      .default(
        "Send a few lines. A photograph helps. We reply within 48 hours with a first sketch and a frank assessment of the brief."
      ),
  }),
  studioTitle: z.string().default("Studio"),
  studioLines: z.array(z.string()).default(["Rue de la Charpente 14", "1040 Brussels, BE"]),
  studioNote: z.string().default("Mon–Fri, by appointment"),
  directEmail: z.string().default(""),
  directPhone: z.string().default(""),
  openingLabel: z.string().default("Next opening"),
  openingValue: z.string().default("Spring 2026"),
  openingNote: z
    .string()
    .default("Build slots open quarterly. Reservation by refundable deposit."),
  nameLabel: z.string().default("Name"),
  emailLabel: z.string().default("Email"),
  messageLabel: z.string().default("Message"),
  sendButtonLabel: z.string().default("Send"),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type ContactContent = z.infer<typeof contactSchema>
