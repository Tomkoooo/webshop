import fs from "node:fs"
import path from "node:path"

/**
 * `wse cmsify <template-dir>` — instrument pure JSX renders with @wse/cms-bridge.
 *
 * Default: report mode. Lists literal text nodes and <img> tags in *.tsx render
 * files with suggested CmsText/CmsImage replacements + content paths.
 *
 * `--write`: applies the safe subset — single-line elements whose only child is
 * literal text become <CmsText>, and discovered fields are appended to
 * `cmsify-fields.json` (input for schema/defaultContent generation).
 */

const RENDER_FILE_RE = /(Render|Sections|Body|Hero|Chrome|Footer|Navbar)\w*\.tsx$|pages\/.*\.tsx$/

const SKIP_TEXT_RE = /^[\s\d.,:;!?()%€$–—-]*$/

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name.endsWith(".tsx")) out.push(full)
  }
  return out
}

function slugifyText(text) {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^\w\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join("_") || "text"
  )
}

/** `<h1 className="...">Literal text</h1>` on one line, no braces inside. */
const SIMPLE_TEXT_ELEMENT_RE =
  /<(h1|h2|h3|h4|h5|h6|p|span|li|figcaption|blockquote|dt|dd)(\s[^<>{}]*)?>([^<>{}\n]{4,})<\/\1>/g

const IMG_TAG_RE = /<img\s[^<>]*src=["']([^"']+)["'][^<>]*\/?>/g

export function cmsifyFile(file, { write }) {
  const source = fs.readFileSync(file, "utf8")
  const findings = []
  const fields = []
  let next = source
  const usedPaths = new Set()

  const uniquePath = (base) => {
    let p = base
    let i = 2
    while (usedPaths.has(p)) p = `${base}_${i++}`
    usedPaths.add(p)
    return p
  }

  next = next.replace(SIMPLE_TEXT_ELEMENT_RE, (match, tag, attrs, text) => {
    const trimmed = text.trim()
    if (SKIP_TEXT_RE.test(trimmed)) return match
    const fieldPath = uniquePath(`copy.${slugifyText(trimmed)}`)
    findings.push({ kind: "text", tag, text: trimmed, path: fieldPath })
    fields.push({ path: fieldPath, type: "string", default: trimmed })
    if (!write) return match
    return `<${tag}${attrs ?? ""}><CmsText path="${fieldPath}" value={${JSON.stringify(trimmed)}} /></${tag}>`
  })

  let m
  IMG_TAG_RE.lastIndex = 0
  while ((m = IMG_TAG_RE.exec(source))) {
    const fieldPath = uniquePath(`media.${slugifyText(path.basename(m[1], path.extname(m[1])))}`)
    findings.push({ kind: "image", src: m[1], path: fieldPath })
    fields.push({ path: fieldPath, type: "image", default: m[1] })
  }

  if (write && next !== source) {
    if (!/from "@wse\/cms-bridge"/.test(next)) {
      next = `import { CmsText } from "@wse/cms-bridge"\n` + next
    }
    fs.writeFileSync(file, next)
  }

  return { findings, fields, changed: write && next !== source }
}

export async function runCmsify(args) {
  const write = args.includes("--write")
  const dirs = args.filter((a) => !a.startsWith("--"))
  if (dirs.length === 0) {
    throw new Error("Usage: wse cmsify <template-dir> [--write]")
  }

  for (const dir of dirs) {
    const abs = path.resolve(dir)
    if (!fs.existsSync(abs)) throw new Error(`Template dir not found: ${abs}`)
    const files = walk(abs).filter((f) => RENDER_FILE_RE.test(path.relative(abs, f)))
    const allFields = []
    let changedCount = 0

    for (const file of files) {
      const rel = path.relative(abs, file)
      const { findings, fields, changed } = cmsifyFile(file, { write })
      if (changed) changedCount++
      allFields.push(...fields.map((f) => ({ ...f, file: rel })))
      for (const finding of findings) {
        const desc =
          finding.kind === "text"
            ? `<${finding.tag}> "${finding.text.slice(0, 60)}"`
            : `<img src="${finding.src}">`
        console.log(`  ${rel}: ${desc} -> ${finding.path}`)
      }
    }

    if (allFields.length > 0) {
      const manifest = path.join(abs, "cmsify-fields.json")
      fs.writeFileSync(manifest, JSON.stringify(allFields, null, 2) + "\n")
      console.log(
        `${path.basename(abs)}: ${allFields.length} candidate fields (${changedCount} files rewritten${write ? "" : ", report only — rerun with --write"}). Manifest: ${manifest}`
      )
    } else {
      console.log(`${path.basename(abs)}: no cmsify candidates found.`)
    }
  }
}
