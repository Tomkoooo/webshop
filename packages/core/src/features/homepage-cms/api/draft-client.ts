import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { FALLBACK_TEMPLATE_ID } from "@wse/core/templates/registry"

export async function saveHomepageDraft(
  snapshot: HomepageSnapshot,
  templateId: string = FALLBACK_TEMPLATE_ID
) {
  const response = await fetch("/api/admin/template-content", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "save-draft",
      templateId,
      pageKey: "page:home",
      value: snapshot,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to save homepage draft")
  }
}
