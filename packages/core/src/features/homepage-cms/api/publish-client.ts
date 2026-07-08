import { FALLBACK_TEMPLATE_ID } from "@wse/core/templates/registry"

export async function publishHomepageDraft(templateId: string = FALLBACK_TEMPLATE_ID) {
  const res = await fetch("/api/admin/template-content", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "publish",
      templateId,
      pageKey: "page:home",
    }),
  })
  if (!res.ok) {
    throw new Error("Failed to publish homepage")
  }
}

export async function discardHomepageDraft(templateId: string = FALLBACK_TEMPLATE_ID) {
  const response = await fetch("/api/admin/template-content", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "discard-draft",
      templateId,
      pageKey: "page:home",
    }),
  })
  if (!response.ok) throw new Error("Failed to discard homepage draft")
  return { ok: true as const }
}
