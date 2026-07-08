import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const contactDefinition: BlockDefinition<"contact"> = {
  type: "contact",
  label: "Kapcsolat",
  create: () => ({
    id: `contact-${Date.now()}`,
    type: "contact",
    enabled: true,
    data: {
      title: "Kapcsolat",
      description: "Lépj kapcsolatba a csapatunkkal.",
      companyName: "Cégnév",
      address: "Cím",
      phone: "+36...",
      email: "hello@example.com",
      sendButtonLabel: "Üzenet küldése",
      nameLabel: "Teljes név",
      emailLabel: "Email cím",
      messageLabel: "Üzenet",
    },
  }),
}
