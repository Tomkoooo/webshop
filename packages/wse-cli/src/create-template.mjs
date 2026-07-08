import { promises as fs, existsSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { validateTemplateDir } from "./validate-template.mjs"

const VALID_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const eq = arg.indexOf("=")
    const key = eq === -1 ? arg : arg.slice(0, eq)
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1)
    if (key === "--id") out.id = value
    else if (key === "--base") out.base = value
    else if (key === "--name") out.name = value
    else if (key === "--deployment") out.deployment = value
  }
  return out
}

function camelCase(id) {
  return id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === "node_modules") continue
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) await copyDir(srcPath, destPath)
    else if (entry.isFile()) await fs.copyFile(srcPath, destPath)
  }
}

function findRepoRoot(start) {
  let dir = start
  while (true) {
    if (existsSync(path.join(dir, "tsconfig.base.json"))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return start
    dir = parent
  }
}

async function rewritePackageJson(dir, id) {
  const pkgPath = path.join(dir, "package.json")
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"))
  pkg.name = `@wse/template-${id}`
  pkg.description = `Webshop Engine template package: ${id}.`
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8")
}

async function rewriteTemplateConfig(dir, { id, name, deployment, baseExportName, exportName }) {
  const configPath = path.join(dir, "template.config.ts")
  let src = await fs.readFile(configPath, "utf8")
  src = src.replace(
    new RegExp(`export const ${baseExportName}(?=\\s*[:=])`),
    `export const ${exportName}`
  )
  src = src.replace(/id:\s*"[^"]+"/, `id: "${id}"`)
  src = src.replace(/name:\s*"[^"]+"/, `name: "${name}"`)
  src = src.replace(/screenshots:\s*\[[^\]]*\]/, `screenshots: ["/template-previews/${id}.svg"]`)
  if (/deployment:\s*"[^"]+"/m.test(src)) {
    src = src.replace(/deployment:\s*"[^"]+"/m, `deployment: "${deployment}"`)
  } else {
    src = src.replace(
      /(\s+surfaces:\s*[A-Z_a-z]+,)/m,
      `$1\n    deployment: "${deployment}",`
    )
  }
  await fs.writeFile(configPath, src, "utf8")
  return configPath
}

async function findBaseExportName(baseDir) {
  const src = await fs.readFile(path.join(baseDir, "template.config.ts"), "utf8")
  const match = src.match(/export const (\w+)\s*[:=]/)
  if (!match) throw new Error(`Could not find template export in ${baseDir}/template.config.ts`)
  return match[1]
}

async function registerLoader(repoRoot, id, exportName) {
  const registryPath = path.join(repoRoot, "packages/core/src/templates/registry.ts")
  let src = await fs.readFile(registryPath, "utf8")
  if (src.includes(`@wse/template-${id}/template.config`)) {
    console.log(`[create-template] '${id}' already registered in core registry — skipping.`)
    return
  }
  const loaderKey = /^[a-z0-9]+$/.test(id) ? id : `"${id}"`
  const loaderLine = `  ${loaderKey}: () => import("@wse/template-${id}/template.config").then((m) => m.${exportName}),\n`
  src = src.replace(
    /(const templateLoaders: Record<string, \(\) => Promise<TemplateModule>> = \{\n)/,
    `$1${loaderLine}`
  )
  await fs.writeFile(registryPath, src, "utf8")
  console.log(`[create-template] Registered lazy loader in packages/core/src/templates/registry.ts`)
}

async function addTsconfigAlias(repoRoot, id) {
  const tsconfigPath = path.join(repoRoot, "tsconfig.base.json")
  let src = await fs.readFile(tsconfigPath, "utf8")
  const alias = `"@wse/template-${id}/*"`
  if (src.includes(alias)) return
  src = src.replace(
    /(\s*)("@wse\/template-[^"]+\/\*":\s*\["packages\/templates\/[^"]+\/\*"\],?\n)(?![\s\S]*"@wse\/template-)/,
    (match, indent, lastLine) =>
      `${indent}${lastLine.trimEnd().endsWith(",") ? lastLine : lastLine.replace(/\n$/, ",\n")}${indent.replace(/^\n/, "")}${alias}: ["packages/templates/${id}/*"],\n`
  )
  await fs.writeFile(tsconfigPath, src, "utf8")
  console.log(`[create-template] Added tsconfig.base.json path alias`)
}

export async function runCreateTemplate(args) {
  const opts = parseArgs(args)
  const id = opts.id?.trim()
  const baseId = (opts.base ?? "default-modern").trim()
  const deployment = (opts.deployment ?? "commerce").trim().toLowerCase()

  if (!id || !VALID_ID.test(id)) {
    console.error(
      'Usage: wse create-template --id my-template [--base default-modern] [--name "My Template"] [--deployment commerce|landing]'
    )
    process.exit(1)
  }
  if (deployment !== "commerce" && deployment !== "landing") {
    console.error("--deployment must be 'commerce' or 'landing'.")
    process.exit(1)
  }
  const name =
    opts.name?.trim() ||
    id
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")

  const repoRoot = findRepoRoot(process.cwd())
  const baseDir = path.join(repoRoot, "packages/templates", baseId)
  const newDir = path.join(repoRoot, "packages/templates", id)

  if (!existsSync(baseDir)) {
    console.error(`Base template '${baseId}' not found at ${baseDir}.`)
    process.exit(1)
  }
  if (existsSync(newDir)) {
    console.error(`Destination already exists: ${newDir}.`)
    process.exit(1)
  }

  console.log(`[create-template] Copying packages/templates/${baseId} → packages/templates/${id}`)
  await copyDir(baseDir, newDir)

  const baseExportName = await findBaseExportName(baseDir)
  const exportName = camelCase(id)

  await rewritePackageJson(newDir, id)
  const configPath = await rewriteTemplateConfig(newDir, {
    id,
    name,
    deployment,
    baseExportName,
    exportName,
  })
  await registerLoader(repoRoot, id, exportName)
  await addTsconfigAlias(repoRoot, id)

  console.log(`[create-template] Running validate-template gate…`)
  const { errors, warnings } = validateTemplateDir(newDir)
  if (errors.length > 0 || warnings.length > 0) {
    console.log(
      `[create-template] Base template '${baseId}' carries ${errors.length} error(s), ${warnings.length} warning(s); fix them as you customize:`
    )
    for (const line of [...errors, ...warnings].slice(0, 20)) console.log(`  - ${line}`)
    const rest = errors.length + warnings.length - 20
    if (rest > 0) console.log(`  … and ${rest} more`)
  } else {
    console.log(`[create-template] validate-template: clean.`)
  }

  console.log(`[create-template] Done. Next steps:`)
  console.log(`  1. Edit ${path.relative(repoRoot, configPath)} (description, version).`)
  console.log(
    `  2. Customize chrome (Navbar/Footer), pages (home/shop/pdp), static-pages, theme.ts — keep all copy behind Cms* / EditableDoc* primitives and colors on theme tokens.`
  )
  console.log(`  3. Declare listFields on pages with arrays so the CMS sidebar list editor works.`)
  console.log(`  4. Add public/template-previews/${id}.svg (manifest screenshots).`)
  console.log(`  5. Gate: node packages/wse-cli/bin/wse.mjs validate-template packages/templates/${id}`)
  console.log(`  6. Run: npm run test:unit -- templates-contract`)
}
