import { z } from "zod"

export const journalSchema = z.object({
  intro: z.object({
    title: z.string().default("Journal"),
    lede: z.string().default(""),
  }),
  posts: z
    .array(
      z.object({
        title: z.string().default(""),
        topic: z.string().default(""),
        excerpt: z.string().default(""),
        bodyHtml: z.string().default(""),
        coverImage: z.string().default(""),
      })
    )
    .max(24)
    .default([]),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type JournalContent = z.infer<typeof journalSchema>
