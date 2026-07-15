import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import {
  OrgAuthError,
  requireOrgContext,
  requireOrgPermission,
  type OrgAuthContext,
} from "../lib/org-auth"
import type { TBookPermission } from "../lib/permissions"

export type AdminAuthResult =
  | { mode: "legacy" }
  | { mode: "org"; ctx: OrgAuthContext; organizationId: string }

export async function resolveTBookAdminAuth(
  permission?: TBookPermission
): Promise<AdminAuthResult> {
  if (!isMultiTenantAdminEnabled()) {
    await requireAdmin()
    return { mode: "legacy" }
  }

  try {
    const ctx = permission ? await requireOrgPermission(permission) : await requireOrgContext()
    return { mode: "org", ctx, organizationId: ctx.organizationId }
  } catch (err) {
    if (err instanceof OrgAuthError && err.statusCode === 401) {
      throw err
    }
    throw err
  }
}

export function orgIdFromAuth(authResult: AdminAuthResult): string | undefined {
  return authResult.mode === "org" ? authResult.organizationId : undefined
}
