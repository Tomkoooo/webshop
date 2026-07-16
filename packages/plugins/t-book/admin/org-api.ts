const ORG_API = "/api/plugins/t-book/org"
const SYSTEM_API = "/api/plugins/t-book/system"

async function orgFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ORG_API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Hiba történt")
  return data as T
}

async function systemFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SYSTEM_API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Hiba történt")
  return data as T
}

export const tbookOrgApi = {
  myOrganizations: () =>
    orgFetch<{ ok: true; organizations: { id: string; name: string; slug: string }[] }>(
      "/my-organizations"
    ),
  switchOrg: (organizationId: string) =>
    orgFetch<{ ok: true }>("/switch", {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    }),
  context: () =>
    orgFetch<{
      ok: true
      organization: { id: string; name: string; slug: string; settings: { currency: string } } | null
      permissions: string[]
    }>("/context"),
  settings: () =>
    orgFetch<{
      ok: true
      organization: {
        id: string
        name: string
        slug: string
        status?: string
        settings: Record<string, unknown> & { currency: string }
      }
    }>("/settings"),
  updateSettings: (body: Record<string, unknown>) =>
    orgFetch<{ ok: true }>("/settings", { method: "PUT", body: JSON.stringify(body) }),
  members: () =>
    orgFetch<{
      ok: true
      members: Array<{
        id: string
        userId: string
        status: string
        user: { name?: string; email?: string } | null
        roles: Array<{ id: string; name: string }>
      }>
    }>("/members"),
  addMember: (body: { email: string; roleIds: string[] }) =>
    orgFetch<{ ok: true }>("/members", { method: "POST", body: JSON.stringify(body) }),
  updateMember: (id: string, body: { roleIds?: string[]; status?: string }) =>
    orgFetch<{ ok: true }>(`/members/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  removeMember: (id: string) =>
    orgFetch<{ ok: true }>(`/members/${id}`, { method: "DELETE" }),
  invites: () =>
    orgFetch<{
      ok: true
      invites: Array<{ id: string; email: string; roleIds: string[]; expiresAt: string }>
    }>("/invites"),
  createInvite: (body: { email: string; roleIds: string[] }) =>
    orgFetch<{ ok: true; inviteId: string; token?: string }>("/invites", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  roles: () =>
    orgFetch<{
      ok: true
      roles: Array<{
        id: string
        name: string
        description: string
        permissions: string[]
        isBuiltIn: boolean
      }>
    }>("/roles"),
  createRole: (body: { name: string; description?: string; permissions: string[] }) =>
    orgFetch<{ ok: true; id: string }>("/roles", { method: "POST", body: JSON.stringify(body) }),
  updateRole: (
    id: string,
    body: { name?: string; description?: string; permissions?: string[] }
  ) => orgFetch<{ ok: true }>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteRole: (id: string) => orgFetch<{ ok: true }>(`/roles/${id}`, { method: "DELETE" }),
}

export const tbookSystemApi = {
  organizations: () =>
    systemFetch<{
      ok: true
      organizations: Array<{
        id: string
        name: string
        slug: string
        status: string
        stats: { groupCount: number; eventCount: number; bookingCount: number; memberCount: number }
      }>
    }>("/organizations"),
  createOrganization: (body: {
    name: string
    ownerEmail?: string
    currency?: string
  }) =>
    systemFetch<{ ok: true; id: string; slug: string }>("/organizations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  organization: (id: string) =>
    systemFetch<{
      ok: true
      organization: {
        id: string
        name: string
        slug: string
        status: string
        settings: { currency: string }
      }
      stats: Record<string, number>
      members: unknown[]
    }>(`/organizations/${id}`),
  updateOrganization: (
    id: string,
    body: { name?: string; status?: string; currency?: string }
  ) =>
    systemFetch<{ ok: true }>(`/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  assignOwner: (id: string, email: string) =>
    systemFetch<{ ok: true }>(`/organizations/${id}/owners`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
}
