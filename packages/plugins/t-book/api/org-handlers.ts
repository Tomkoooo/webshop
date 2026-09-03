import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import { TBookOrgService } from "../services/org-service"
import {
  OrgAuthError,
  assertUserOrganizationAccess,
  requireOrgContext,
  requireOrgPermission,
  requireSystemAdmin,
} from "../lib/org-auth"
import { activeOrgCookieOptions } from "../lib/org-cookie"
import { resolveTBookPostLoginRedirect } from "../lib/post-login-redirect"
import { auth } from "@wse/core/auth"

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

function handleError(err: unknown) {
  if (err instanceof OrgAuthError) {
    return json({ error: err.message }, err.statusCode)
  }
  if (err instanceof Error) {
    return json({ error: err.message }, 400)
  }
  return json({ error: "Hiba történt" }, 500)
}

async function resolveMemberRoleIds(organizationId: string, raw: unknown): Promise<string[]> {
  const roleIds = Array.isArray(raw) ? raw.map(String).filter(Boolean) : []
  if (roleIds.length > 0) return roleIds
  return TBookOrgService.getDefaultMemberRoleIds(organizationId)
}

export async function handleTBookOrgApi(
  path: string[],
  request: Request,
  method: string
): Promise<Response> {
  if (!isMultiTenantAdminEnabled()) {
    return json({ error: "Not found" }, 404)
  }

  const segment = path[0] ?? ""

  try {
    if (segment === "accept-invite" && method === "POST") {
      const session = await auth()
      if (!session?.user?.id || !session.user.email) {
        return json({ error: "Bejelentkezés szükséges." }, 401)
      }
      const body = await request.json()
      const token = String(body.token ?? "")
      const orgId = await TBookOrgService.acceptInviteByToken(token, session.user.id, session.user.email)
      if (!orgId) return json({ error: "Érvénytelen vagy lejárt meghívó." }, 400)
      const jar = await cookies()
      jar.set(activeOrgCookieOptions(orgId))
      return json({ ok: true, organizationId: orgId, redirectTo: "/admin" })
    }

    if (segment === "switch" && method === "POST") {
      const session = await auth()
      if (!session?.user?.id) return json({ error: "Bejelentkezés szükséges." }, 401)
      const body = await request.json()
      const organizationId = String(body.organizationId ?? "").trim()
      await assertUserOrganizationAccess(session.user.id, organizationId)
      const jar = await cookies()
      jar.set(activeOrgCookieOptions(organizationId))
      return json({ ok: true, organizationId })
    }

    if (segment === "my-organizations" && method === "GET") {
      const session = await auth()
      if (!session?.user?.id) return json({ error: "Unauthorized" }, 401)
      const organizations = await TBookOrgService.listOrganizationsForUser(session.user.id)
      return json({ ok: true, organizations })
    }

    if (segment === "context" && method === "GET") {
      const ctx = await requireOrgContext()
      const org = await TBookOrgService.getOrganization(ctx.organizationId)
      return json({
        ok: true,
        organization: org
          ? {
              id: String(org._id),
              name: org.name,
              slug: org.slug,
              status: org.status,
              settings: org.settings,
            }
          : null,
        permissions: [...ctx.permissions],
      })
    }

    if (segment === "settings" && method === "GET") {
      const ctx = await requireOrgPermission("org:read")
      const organization = await TBookOrgService.getOrgSettingsPublic(ctx.organizationId)
      if (!organization) return json({ error: "Szervezet nem található." }, 404)
      return json({ ok: true, organization })
    }

    if (segment === "settings" && method === "PUT") {
      const ctx = await requireOrgPermission("org:update")
      const body = await request.json()
      await TBookOrgService.updateOrgSettings(ctx.organizationId, {
        name: body.name,
        currency: body.currency,
        stripe: body.stripe,
        smtp: body.smtp,
        szamlazz: body.szamlazz,
        tdarts: body.tdarts,
        emailTemplates: body.emailTemplates,
      })
      return json({ ok: true })
    }

    if (segment === "members" && method === "GET" && path.length === 1) {
      const ctx = await requireOrgPermission("member:read")
      const members = await TBookOrgService.listMembers(ctx.organizationId)
      return json({ ok: true, members })
    }

    if (segment === "members" && method === "POST" && path.length === 1) {
      const ctx = await requireOrgPermission("member:manage")
      const body = await request.json()
      const email = String(body.email ?? "").trim()
      const roleIds = await resolveMemberRoleIds(ctx.organizationId, body.roleIds)
      const user = await TBookOrgService.findUserByEmail(email)
      if (!user) {
        return json({ error: "Felhasználó nem található — használd a meghívót." }, 404)
      }
      await TBookOrgService.addMember({
        organizationId: ctx.organizationId,
        userId: String(user._id),
        roleIds,
      })
      return json({ ok: true })
    }

    if (segment === "members" && path[1] && method === "PUT" && path.length === 2) {
      const ctx = await requireOrgPermission("member:manage")
      const body = await request.json()
      await TBookOrgService.updateMember({
        organizationId: ctx.organizationId,
        membershipId: path[1]!,
        roleIds: Array.isArray(body.roleIds) ? body.roleIds.map(String) : undefined,
        status: body.status,
      })
      return json({ ok: true })
    }

    if (segment === "members" && path[1] && method === "DELETE" && path.length === 2) {
      const ctx = await requireOrgPermission("member:manage")
      await TBookOrgService.removeMember(ctx.organizationId, path[1]!)
      return json({ ok: true })
    }

    if (segment === "invites" && method === "GET") {
      const ctx = await requireOrgPermission("member:read")
      const invites = await TBookOrgService.listInvites(ctx.organizationId)
      return json({
        ok: true,
        invites: invites.map((i) => ({
          id: String(i._id),
          email: i.email,
          roleIds: (i.roleIds ?? []).map(String),
          expiresAt: i.expiresAt,
          createdAt: i.createdAt,
        })),
      })
    }

    if (segment === "invites" && method === "POST") {
      const ctx = await requireOrgPermission("member:invite")
      const body = await request.json()
      const roleIds = await resolveMemberRoleIds(ctx.organizationId, body.roleIds)
      const result = await TBookOrgService.createInvite({
        organizationId: ctx.organizationId,
        email: String(body.email ?? ""),
        roleIds,
        invitedByUserId: ctx.userId,
      })
      return json({ ok: true, ...result })
    }

    if (segment === "roles" && method === "GET" && path.length === 1) {
      const ctx = await requireOrgPermission("role:read")
      const roles = await TBookOrgService.listRoles(ctx.organizationId)
      return json({
        ok: true,
        roles: roles.map((r) => ({
          id: String(r._id),
          name: r.name,
          description: r.description,
          permissions: r.permissions,
          isBuiltIn: r.isBuiltIn,
        })),
      })
    }

    if (segment === "roles" && method === "POST" && path.length === 1) {
      const ctx = await requireOrgPermission("role:manage")
      const body = await request.json()
      const role = await TBookOrgService.createRole({
        organizationId: ctx.organizationId,
        name: String(body.name ?? ""),
        description: body.description,
        permissions: body.permissions ?? [],
      })
      return json({ ok: true, id: String(role._id) })
    }

    if (segment === "roles" && path[1] && method === "PUT" && path.length === 2) {
      const ctx = await requireOrgPermission("role:manage")
      const body = await request.json()
      await TBookOrgService.updateRole({
        organizationId: ctx.organizationId,
        roleId: path[1]!,
        name: body.name,
        description: body.description,
        permissions: body.permissions,
      })
      return json({ ok: true })
    }

    if (segment === "roles" && path[1] && method === "DELETE" && path.length === 2) {
      const ctx = await requireOrgPermission("role:manage")
      await TBookOrgService.deleteRole(ctx.organizationId, path[1]!)
      return json({ ok: true })
    }

    if (segment === "post-login" && method === "GET") {
      const url = new URL(request.url)
      const redirectTo = await resolveTBookPostLoginRedirect(url.searchParams.get("callbackUrl"))
      return json({ ok: true, redirectTo })
    }

    return json({ error: "Org route not found", path }, 404)
  } catch (err) {
    return handleError(err)
  }
}

export async function handleTBookSystemApi(
  path: string[],
  request: Request,
  method: string
): Promise<Response> {
  if (!isMultiTenantAdminEnabled()) {
    return json({ error: "Not found" }, 404)
  }

  const segment = path[0] ?? ""

  try {
    await requireSystemAdmin()

    if (segment === "organizations" && method === "GET" && path.length === 1) {
      const orgs = await TBookOrgService.listOrganizations()
      const enriched = await Promise.all(
        orgs.map(async (org) => ({
          id: String(org._id),
          name: org.name,
          slug: org.slug,
          status: org.status,
          createdAt: org.createdAt,
          stats: await TBookOrgService.getOrganizationStats(String(org._id)),
        }))
      )
      return json({ ok: true, organizations: enriched })
    }

    if (segment === "organizations" && method === "POST" && path.length === 1) {
      const body = await request.json()
      const { userId } = await requireSystemAdmin()
      const result = await TBookOrgService.createOrganization({
        name: String(body.name ?? ""),
        createdByUserId: userId,
        ownerUserId: body.ownerUserId ? String(body.ownerUserId) : null,
        ownerEmail: body.ownerEmail ? String(body.ownerEmail) : null,
        currency: body.currency,
      })
      return json({
        ok: true,
        id: String(result.organization._id),
        slug: result.organization.slug,
      })
    }

    if (segment === "organizations" && path[1] && method === "GET" && path.length === 2) {
      const org = await TBookOrgService.getOrganization(path[1]!)
      if (!org) return json({ error: "Szervezet nem található." }, 404)
      const stats = await TBookOrgService.getOrganizationStats(path[1]!)
      const members = await TBookOrgService.listMembers(path[1]!)
      return json({
        ok: true,
        organization: {
          id: String(org._id),
          name: org.name,
          slug: org.slug,
          status: org.status,
          settings: org.settings,
          createdAt: org.createdAt,
        },
        stats,
        members,
      })
    }

    if (segment === "organizations" && path[1] && method === "PUT" && path.length === 2) {
      const body = await request.json()
      await TBookOrgService.updateOrganization(path[1]!, {
        name: body.name,
        status: body.status,
        currency: body.currency,
      })
      return json({ ok: true })
    }

    if (segment === "organizations" && path[1] && path[2] === "owners" && method === "POST") {
      const body = await request.json()
      const ownerRoleId = await TBookOrgService.getOwnerRoleId(path[1]!)
      if (!ownerRoleId) return json({ error: "Owner szerepkör nem található." }, 500)
      const email = String(body.email ?? "").trim()
      const user = await TBookOrgService.findUserByEmail(email)
      if (user) {
        await TBookOrgService.addMember({
          organizationId: path[1]!,
          userId: String(user._id),
          roleIds: [ownerRoleId],
        })
      } else {
        await TBookOrgService.createInvite({
          organizationId: path[1]!,
          email,
          roleIds: [ownerRoleId],
          invitedByUserId: (await requireSystemAdmin()).userId,
        })
      }
      return json({ ok: true })
    }

    return json({ error: "System route not found", path }, 404)
  } catch (err) {
    return handleError(err)
  }
}
