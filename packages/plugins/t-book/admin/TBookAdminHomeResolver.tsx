import { cookies } from "next/headers"
import { resolveAdminAccess } from "@wse/core/lib/admin-access"
import {
  activeOrgCookieOptions,
  getActiveOrganizationIdFromCookie,
} from "@wse/plugin-t-book/lib/org-cookie"
import { TBookDashboard } from "./TBookDashboard"
import { TBookOrgSelectScreen } from "./TBookOrgSelectScreen"
import { TBookSystemAdminScreen } from "./TBookSystemAdminScreen"

/**
 * Role-aware `/admin` home for multi-tenant tBook deployments:
 * - active org → operational dashboard
 * - org member, no selection → org picker (auto-selects when only one)
 * - system admin only → platform dashboard
 */
export async function TBookAdminHomeResolver() {
  const access = await resolveAdminAccess()
  let activeOrgId = await getActiveOrganizationIdFromCookie()

  if (!activeOrgId && access.organizationIds.length === 1) {
    activeOrgId = access.organizationIds[0]!
    const jar = await cookies()
    jar.set(activeOrgCookieOptions(activeOrgId))
  }

  const canUseActiveOrg =
    Boolean(activeOrgId) &&
    (access.isSystemAdmin || access.organizationIds.includes(activeOrgId!))

  if (canUseActiveOrg) {
    return <TBookDashboard />
  }

  if (access.organizationIds.length > 0) {
    return <TBookOrgSelectScreen />
  }

  if (access.isSystemAdmin) {
    return <TBookSystemAdminScreen />
  }

  return <TBookOrgSelectScreen />
}
