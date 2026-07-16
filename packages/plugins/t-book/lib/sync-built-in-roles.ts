import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import TBookOrgRole from "../models/TBookOrgRole"
import { TBOOK_OWNER_PERMISSIONS, TBOOK_VIEWER_PERMISSIONS } from "./permissions"

function samePermissionSet(a: string[] | undefined, b: readonly string[]): boolean {
  if (!a || a.length !== b.length) return false
  const set = new Set(a)
  return b.every((p) => set.has(p))
}

/**
 * Keep built-in Owner/Viewer permission arrays in sync with the current catalog.
 * Orgs created before new permissions were added otherwise keep a stale snapshot
 * (e.g. missing voucher:scan).
 */
export async function syncBuiltInRolePermissions(
  organizationId: string | mongoose.Types.ObjectId
): Promise<void> {
  await dbConnect()
  const orgOid =
    typeof organizationId === "string"
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId

  const roles = await TBookOrgRole.find({
    organizationId: orgOid,
    isBuiltIn: true,
  })

  for (const role of roles) {
    const target =
      role.name === "Owner"
        ? TBOOK_OWNER_PERMISSIONS
        : role.name === "Viewer"
          ? TBOOK_VIEWER_PERMISSIONS
          : null
    if (!target) continue
    // Additive only — never strip permissions an admin intentionally kept on a built-in role,
    // but always grant newly added catalog permissions (e.g. voucher:scan).
    const merged = Array.from(new Set([...(role.permissions ?? []), ...target]))
    if (samePermissionSet(role.permissions, merged)) continue
    role.permissions = merged
    await role.save()
  }
}
