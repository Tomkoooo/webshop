import crypto from "node:crypto"
import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import User from "@wse/core/models/User"
import { auth } from "@wse/core/auth"
import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import { getActiveOrganizationIdFromCookie } from "./org-cookie"
import TBookOrganization from "../models/TBookOrganization"
import TBookOrgMembership from "../models/TBookOrgMembership"
import TBookOrgRole from "../models/TBookOrgRole"
import type { TBookPermission } from "./permissions"

export type OrgAuthContext = {
  userId: string
  organizationId: string
  permissions: Set<TBookPermission>
  membershipId: string
}

export class OrgAuthError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 403) {
    super(message)
    this.statusCode = statusCode
  }
}

function oid(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new OrgAuthError("Érvénytelen azonosító.", 400)
  }
  return new mongoose.Types.ObjectId(id)
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id?.trim() || null
}

export async function isUserSystemAdmin(userId: string): Promise<boolean> {
  await dbConnect()
  const user = await User.findById(oid(userId)).select("isSystemAdmin role").lean()
  if (!user) return false
  if (user.isSystemAdmin === true) return true
  // Legacy fallback during migration
  return user.role === "ADMIN" && !isMultiTenantAdminEnabled()
}

export async function listUserOrganizationIds(userId: string): Promise<string[]> {
  await dbConnect()
  const memberships = await TBookOrgMembership.find({
    userId: oid(userId),
    status: "active",
  })
    .select("organizationId")
    .lean()
  return memberships.map((m) => String(m.organizationId))
}

export async function resolveMembershipPermissions(
  organizationId: string,
  userId: string
): Promise<{ permissions: Set<TBookPermission>; membershipId: string } | null> {
  await dbConnect()
  const membership = await TBookOrgMembership.findOne({
    organizationId: oid(organizationId),
    userId: oid(userId),
    status: "active",
  }).lean()

  if (!membership) return null

  const roles = await TBookOrgRole.find({
    _id: { $in: membership.roleIds ?? [] },
    organizationId: oid(organizationId),
  }).lean()

  const permissions = new Set<TBookPermission>()
  for (const role of roles) {
    for (const perm of role.permissions ?? []) {
      permissions.add(perm as TBookPermission)
    }
  }

  return { permissions, membershipId: String(membership._id) }
}

export async function requireSystemAdmin() {
  const userId = await getSessionUserId()
  if (!userId) throw new OrgAuthError("Bejelentkezés szükséges.", 401)
  const ok = await isUserSystemAdmin(userId)
  if (!ok) throw new OrgAuthError("Nincs rendszer admin jogosultság.", 403)
  return { userId }
}

export async function requireOrgContext(preferredOrgId?: string | null): Promise<OrgAuthContext> {
  const userId = await getSessionUserId()
  if (!userId) throw new OrgAuthError("Bejelentkezés szükséges.", 401)

  const cookieOrgId = preferredOrgId ?? (await getActiveOrganizationIdFromCookie())
  if (!cookieOrgId) {
    throw new OrgAuthError("Válassz szervezetet a folytatáshoz.", 403)
  }

  await dbConnect()
  const org = await TBookOrganization.findById(oid(cookieOrgId)).lean()
  if (!org) throw new OrgAuthError("Szervezet nem található.", 404)
  if (org.status === "suspended") throw new OrgAuthError("A szervezet fel van függesztve.", 403)

  const membership = await resolveMembershipPermissions(cookieOrgId, userId)
  if (!membership) {
    const systemAdmin = await isUserSystemAdmin(userId)
    if (systemAdmin) {
      return {
        userId,
        organizationId: cookieOrgId,
        permissions: new Set<TBookPermission>(),
        membershipId: "",
      }
    }
    throw new OrgAuthError("Nincs hozzáférésed ehhez a szervezethez.", 403)
  }

  return {
    userId,
    organizationId: cookieOrgId,
    permissions: membership.permissions,
    membershipId: membership.membershipId,
  }
}

export async function requireOrgPermission(
  permission: TBookPermission,
  preferredOrgId?: string | null
): Promise<OrgAuthContext> {
  const ctx = await requireOrgContext(preferredOrgId)
  if (ctx.permissions.size === 0 && (await isUserSystemAdmin(ctx.userId))) {
    return ctx
  }
  if (!ctx.permissions.has(permission)) {
    throw new OrgAuthError("Nincs jogosultságod ehhez a művelethez.", 403)
  }
  return ctx
}

export function orgScopeFilter(organizationId: string) {
  return { organizationId: oid(organizationId) }
}

export async function assertResourceInOrg(
  organizationId: string,
  resourceOrgId: mongoose.Types.ObjectId | string | null | undefined
) {
  if (!resourceOrgId) {
    throw new OrgAuthError("Az erőforrás nem tartozik szervezethez.", 404)
  }
  if (String(resourceOrgId) !== organizationId) {
    throw new OrgAuthError("Az erőforrás más szervezethez tartozik.", 403)
  }
}

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}
