export async function saveTemplatePageDraft(templateId: string, pageKey: string, value: unknown) {
  const response = await fetch("/api/admin/template-content", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "save-draft",
      templateId,
      pageKey,
      value,
    }),
  })
  if (!response.ok) throw new Error("save-draft failed")
}

export async function publishTemplatePageContent(templateId: string, pageKey: string) {
  const res = await fetch("/api/admin/template-content", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "publish", templateId, pageKey }),
  })
  if (!res.ok) throw new Error("publish failed")
}

export async function discardTemplatePageDraft(templateId: string, pageKey: string) {
  const res = await fetch("/api/admin/template-content", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "discard-draft", templateId, pageKey }),
  })
  if (!res.ok) throw new Error("discard-draft failed")
}
