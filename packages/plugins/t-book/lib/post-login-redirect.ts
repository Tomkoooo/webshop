import { auth } from "@wse/core/auth"
import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import dbConnect from "@wse/core/lib/db"
import User from "@wse/core/models/User"
import { TBookOrgService } from "../services/org-service"
import { activeOrgCookieOptions } from "../lib/org-cookie"
import { listUserOrganizationIds } from "../lib/org-auth"

export async function resolveTBookPostLoginRedirect(callbackUrl?: string | null): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) return "/auth/admin-login"

  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : null

  if (!isMultiTenantAdminEnabled()) {
    return safeCallback ?? "/admin"
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
    return safeCallback
  }

  if (isSystemAdmin && orgIds.length === 0) return "/admin"
  if (orgIds.length === 1) {
    const jar = await cookies()
    jar.set(activeOrgCookieOptions(orgIds[0]!))
    return "/admin"
  }
  if (orgIds.length > 1) return "/admin/org/select"
  if (isSystemAdmin) return "/admin"
  return "/auth/no-admin-access"
}

export async function redirectTBookAfterAdminLogin(callbackUrl?: string | null): Promise<never> {
  redirect(await resolveTBookPostLoginRedirect(callbackUrl))
}
