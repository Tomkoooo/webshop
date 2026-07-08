export const PRESS_KIT_ADMIN_API = "/api/plugins/press-kit/admin"

export type PressKitAccessMode = "shared_password" | "password_per_contact" | "unique_link"

export type PressKitPageContentDto = {
  blocks: Array<{
    id: string
    type: string
    [key: string]: unknown
  }>
}

export type PressKitSettingsDto = {
  accessMode: PressKitAccessMode
  pageTitle: string
  heroImage: string
  embargoNote: string
  sections: Array<{ id: string; title: string; bodyHtml: string }>
  productHighlights: Array<{ label: string; detail: string }>
  pageContent?: PressKitPageContentDto
  pdfMediaFilename: string
  pdfSettings: {
    allowDownload: boolean
    watermarkTemplate: string
    disableTextSelection: boolean
    showPageNav: boolean
  }
  isPublished: boolean
  publishedAt: string | null
  hasSharedPassword: boolean
}

export type PressContactDto = {
  id: string
  name: string
  outlet: string
  email: string
  accessToken: string
  isActive: boolean
  inviteSentAt: string | null
  lastAccessAt: string | null
  notes: string
  hasPassword: boolean
}

export type PressStatsRow = {
  contactId: string
  name: string
  outlet: string
  email: string
  portalOpens: number
  pageViews: number
  pdfOpens: number
  pdfPageViews: number
  lastEventAt: string | null
}

async function pressAdminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PRESS_KIT_ADMIN_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Kérés sikertelen")
  }
  return data as T
}

export const pressKitAdminApi = {
  getOverview: () =>
    pressAdminFetch<{ ok: true; stats: Record<string, unknown>; settings: PressKitSettingsDto }>(
      "/overview"
    ),
  getSettings: () =>
    pressAdminFetch<{ ok: true; settings: PressKitSettingsDto }>("/settings"),
  updateSettings: (body: Record<string, unknown>) =>
    pressAdminFetch<{ ok: true; settings: PressKitSettingsDto }>("/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  listContacts: () =>
    pressAdminFetch<{ ok: true; contacts: PressContactDto[] }>("/contacts"),
  createContact: (body: Record<string, unknown>) =>
    pressAdminFetch<{ ok: true; contact: PressContactDto; plainPassword: string | null }>(
      "/contacts",
      { method: "POST", body: JSON.stringify(body) }
    ),
  updateContact: (id: string, body: Record<string, unknown>) =>
    pressAdminFetch<{ ok: true; contact: PressContactDto; plainPassword: string | null }>(
      `/contacts/${id}`,
      { method: "PUT", body: JSON.stringify(body) }
    ),
  deleteContact: (id: string) =>
    pressAdminFetch<{ ok: true }>(`/contacts/${id}`, { method: "DELETE" }),
  sendInvites: (contactIds: string[]) =>
    pressAdminFetch<{ ok: true; sent: number; failed: string[] }>("/invite", {
      method: "POST",
      body: JSON.stringify({ contactIds }),
    }),
  getStats: (from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    const q = params.toString()
    return pressAdminFetch<{ ok: true; rows: PressStatsRow[] }>(`/stats${q ? `?${q}` : ""}`)
  },
}
