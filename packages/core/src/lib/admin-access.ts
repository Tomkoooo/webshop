import dbConnect from "@wse/core/lib/db"
import User from "@wse/core/models/User"
import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import { auth } from "@wse/core/auth"

export type AdminAccessResult = {
  allowed: boolean
  isSystemAdmin: boolean
  organizationIds: string[]
  userId: string | null
}

export async function resolveAdminAccess(): Promise<AdminAccessResult> {
  const session = await auth()
  const userId = session?.user?.id?.trim() || null

  if (!userId) {
    return { allowed: false, isSystemAdmin: false, organizationIds: [], userId: null }
  }

  if (!isMultiTenantAdminEnabled()) {
    const isAdmin = session?.user?.role === "ADMIN"
    return {
      allowed: isAdmin,
      isSystemAdmin: isAdmin,
      organizationIds: [],
      userId,
    }
  }

  await dbConnect()
  const user = await User.findById(userId).select("isSystemAdmin role").lean()
  const isSystemAdmin = user?.isSystemAdmin === true

  const { listUserOrganizationIds } = await import("@wse/plugin-t-book/lib/org-auth")
  const organizationIds = await listUserOrganizationIds(userId)

  return {
    allowed: isSystemAdmin || organizationIds.length > 0,
    isSystemAdmin,
    organizationIds,
    userId,
  }
}
