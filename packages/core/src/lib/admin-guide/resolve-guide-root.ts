import fs from "fs"
import path from "path"

/** Walk up from cwd until `docs/admin-user-guide` is found (monorepo root vs site app). */
export function resolveAdminGuideRoot(): string {
  let dir = process.cwd()
  for (let depth = 0; depth < 8; depth++) {
    const candidate = path.join(dir, "docs/admin-user-guide")
    if (fs.existsSync(candidate)) {
      return candidate
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error(
    "Could not locate docs/admin-user-guide. Ensure the guide exists at the repository root."
  )
}
