import fs from "fs/promises"
import path from "path"
import { resolveAdminGuideRoot } from "@wse/core/lib/admin-guide/resolve-guide-root"

export async function loadGuideSectionMarkdown(relativeFile: string): Promise<string> {
  const filePath = path.join(resolveAdminGuideRoot(), relativeFile)
  return fs.readFile(filePath, "utf8")
}
