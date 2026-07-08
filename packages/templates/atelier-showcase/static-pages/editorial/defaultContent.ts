import { editorialSchema, type EditorialContent } from "./schema"

export const editorialDefaultContent: EditorialContent = editorialSchema.parse({
  hero: {
    title: "The atelier notebook",
    subtitle: "Materials, process, and the people behind every piece we ship.",
    image: "/placeholder.png",
  },
  sections: [
    {
      heading: "Why texture matters",
      body: "<p>We photograph every batch in natural light so you see grain, weave, and patina — not a studio fiction. When you choose from the journal, you are reading the same notes our cutters use on the bench.</p>",
      image: "/placeholder.png",
      layout: "imageRight",
    },
    {
      heading: "From bolt to box",
      body: "<p>Each order is folded with paper that carries our pigment line. Recycle the wrap or keep it; either way it was chosen to age the way linen does beside a window.</p>",
      image: "/placeholder.png",
      layout: "imageLeft",
    },
  ],
  meta: {
    seoTitle: "Editorial · Atelier Showcase",
    seoDescription: "Long-form editorial layout with CMS-managed sections and imagery.",
  },
})
