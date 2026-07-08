import type { ContactContent } from "./schema"

export const contactDefaultContent: ContactContent = {
  hero: {
    eyebrow: "Begin a project — 003",
    title: "Tell us about your site.",
    subtitle:
      "Send a few lines. A photograph helps. We reply within 48 hours with a first sketch and a frank assessment of the brief.",
  },
  studioTitle: "Studio",
  studioLines: ["Rue de la Charpente 14", "1040 Brussels, BE"],
  studioNote: "Mon–Fri, by appointment",
  directEmail: "studio@cabinova.example",
  directPhone: "+32 2 503 14 20",
  openingLabel: "Next opening",
  openingValue: "Spring 2026",
  openingNote: "Build slots open quarterly. Reservation by refundable deposit.",
  nameLabel: "Name",
  emailLabel: "Email",
  messageLabel: "Message",
  sendButtonLabel: "Send",
  meta: {
    seoTitle: "Contact — Cabinova",
    seoDescription: "Begin a project with Cabinova. We reply within 48 hours.",
  },
}
