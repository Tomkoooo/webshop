import { auth } from "@wse/core/auth"
import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import dbConnect from "@wse/core/lib/db"
import User from "@wse/core/models/User"
import { TBookOrgService } from "../services/org-service"
import { listUserOrganizationIds } from "../lib/org-auth"

export type TBookPostLoginTarget = {
  redirectPath: string
  /** When set, callers in a Route Handler should persist this as the active-org cookie. */
  autoSelectOrgId: string | null
}

export async function resolveTBookPostLoginTarget(
  callbackUrl?: string | null
): Promise<TBookPostLoginTarget> {
  const session = await auth()
  if (!session?.user?.id) {
    return { redirectPath: "/auth/admin-login", autoSelectOrgId: null }
  }

  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : null

  if (!isMultiTenantAdminEnabled()) {
    return { redirectPath: safeCallback ?? "/admin", autoSelectOrgId: null }
  }

  await dbConnect()
  const user = await User.findById(session.user.id).lean()
  const email = user?.email ?? session.user.email
  if (email) {
    await TBookOrgService.processPendingInvitesForEmail(email, session.user.id)
  }

  const isSystemAdmin = user?.isSystemAdmin === true
  const orgIds = await listUserOrganizationIds(session.user.id)

  if (safeCallback && !safeCallback.startsWith("/admin/org/select")) {
    return { redirectPath: safeCallback, autoSelectOrgId: null }
  }

  if (isSystemAdmin && orgIds.length === 0) {
    return { redirectPath: "/admin", autoSelectOrgId: null }
  }
  if (orgIds.length === 1) {
    return { redirectPath: "/admin", autoSelectOrgId: orgIds[0]! }
  }
  if (orgIds.length > 1) {
    return { redirectPath: "/admin/org/select", autoSelectOrgId: null }
  }
  if (isSystemAdmin) {
    return { redirectPath: "/admin", autoSelectOrgId: null }
  }
  return { redirectPath: "/auth/no-admin-access", autoSelectOrgId: null }
}

/** Redirect path only — safe from Route Handlers and JSON APIs (no cookie writes). */
export async function resolveTBookPostLoginRedirect(callbackUrl?: string | null): Promise<string> {
  const { redirectPath } = await resolveTBookPostLoginTarget(callbackUrl)
  return redirectPath
}
