import fs from "fs/promises"
import path from "path"

const GUIDE_ROOT = path.join(process.cwd(), "docs/admin-user-guide")

export async function loadGuideSectionMarkdown(relativeFile: string): Promise<string> {
  const filePath = path.join(GUIDE_ROOT, relativeFile)
  return fs.readFile(filePath, "utf8")
}
