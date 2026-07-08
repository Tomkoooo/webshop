const PRESS_API = "/api/plugins/press-kit"

export type PressContactSession = {
  id: string
  name: string
  outlet: string
  email: string
}

export type PressKitPageContentDto = {
  blocks: Array<{
    id: string
    type: string
    [key: string]: unknown
  }>
}

export type PressContentResponse = {
  ok: true
  content: {
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
  }
  contact: PressContactSession
  watermark: string
  accessMode: string
}

export const pressPortalApi = {
  getPortalConfig: () =>
    fetch(`${PRESS_API}/portal-config`).then((r) => r.json()) as Promise<{
      ok: boolean
      accessMode: string
      isPublished: boolean
    }>,
  getSession: () =>
    fetch(`${PRESS_API}/session`, { credentials: "include" }).then((r) => r.json()) as Promise<{
      ok: boolean
      contact?: PressContactSession
    }>,
  auth: (body: Record<string, string>) =>
    fetch(`${PRESS_API}/auth`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || "Belépés sikertelen")
      return data as { ok: true; contact: PressContactSession }
    }),
  logout: () =>
    fetch(`${PRESS_API}/logout`, { method: "POST", credentials: "include" }),
  getContent: () =>
    fetch(`${PRESS_API}/content`, { credentials: "include" }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || "Tartalom nem elérhető")
      return data as PressContentResponse
    }),
  logEvent: (event: string, metadata?: Record<string, unknown>) =>
    fetch(`${PRESS_API}/log`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, metadata }),
    }),
  pdfFileUrl: () => `${PRESS_API}/pdf/file`,
}
