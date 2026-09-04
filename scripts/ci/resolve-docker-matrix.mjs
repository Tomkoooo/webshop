#!/usr/bin/env node
/**
 * Decide which GHCR site images to rebuild from a changed-file list.
 *
 * Shared engine (core/sdk/admin/lockfile/Dockerfile) → every image in the catalog.
 * A site app, its template package, or its plugin package → only that image.
 * Docs/tests/scripts-only → none.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..")

export const ENGINE_V2_IMAGES = [
  { site_app: "apps/tbook", site_server: "apps/tbook/server.js", image_tag: "engine-v2" },
  { site_app: "apps/reference", site_server: "apps/reference/server.js", image_tag: "engine-v2-reference" },
  {
    site_app: "apps/world-darts-festival",
    site_server: "apps/world-darts-festival/server.js",
    image_tag: "world-darts-festival",
  },
  { site_app: "apps/sorfeszt", site_server: "apps/sorfeszt/server.js", image_tag: "sorfeszt" },
  { site_app: "apps/eventstructure", site_server: "apps/eventstructure/server.js", image_tag: "eventstructure" },
  { site_app: "apps/dr-zsanett", site_server: "apps/dr-zsanett/server.js", image_tag: "dr-zsanett" },
]

export const MAIN_IMAGES = [
  { site_app: "apps/reference", site_server: "apps/reference/server.js", image_tag: "latest" },
]

const SHARED_PREFIXES = [
  "Dockerfile",
  "package.json",
  "package-lock.json",
  "tsconfig.base.json",
  ".npmrc",
  "packages/core/",
  "packages/sdk/",
  "packages/admin/",
  "packages/cms-bridge/",
  "packages/wse-cli/",
]

const IGNORED_PREFIXES = [
  "docs/",
  "tests/",
  "scripts/",
  ".github/",
  ".cursor/",
  ".claude/",
  "AGENTS.md",
  "README.md",
  ".gitignore",
  "portainer.stack.yml",
  // Deploy catalog edits are validated in the test job; they need not rebuild every site image.
  "deployments.config.json",
]

function catalogForRef(ref) {
  return ref === "refs/heads/engine-v2" || ref === "engine-v2" ? ENGINE_V2_IMAGES : MAIN_IMAGES
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

function workspacePackageNames(kind) {
  const dir = join(ROOT, "packages", kind)
  /** @type {Map<string, string>} folder prefix → npm name */
  const map = new Map()
  if (!existsSync(dir)) return map
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const pkgPath = join(dir, entry.name, "package.json")
    if (!existsSync(pkgPath)) continue
    const name = readJson(pkgPath).name
    if (typeof name === "string") {
      map.set(`packages/${kind}/${entry.name}/`, name)
    }
  }
  return map
}

function siteWorkspaceNames(siteApp) {
  const names = new Set()
  const pkgPath = join(ROOT, siteApp, "package.json")
  if (existsSync(pkgPath)) {
    const pkg = readJson(pkgPath)
    for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
      if (dep.startsWith("@wse/")) names.add(dep)
    }
  }
  const wsePath = join(ROOT, siteApp, "wse.config.json")
  if (existsSync(wsePath)) {
    const wse = readJson(wsePath)
    for (const source of wse.routeSources ?? []) {
      if (typeof source.specifier === "string" && source.specifier.startsWith("@wse/")) {
        names.add(source.specifier.replace(/\/app$/, ""))
      }
    }
  }
  const nextPath = join(ROOT, siteApp, "next.config.ts")
  if (existsSync(nextPath)) {
    const src = readFileSync(nextPath, "utf8")
    const match = src.match(/WSE_SITE_CONFIG_JSON:\s*"((?:\\.|[^"\\])*)"/)
    if (match) {
      try {
        const cfg = JSON.parse(match[1].replace(/\\"/g, '"'))
        if (cfg.templateId) names.add(`@wse/template-${cfg.templateId}`)
        for (const id of cfg.allowedTemplates ?? []) names.add(`@wse/template-${id}`)
        for (const id of cfg.plugins ?? []) names.add(`@wse/plugin-${id}`)
      } catch {
        /* ignore malformed baked config */
      }
    }
  }
  return names
}

function isIgnored(file) {
  return IGNORED_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix))
}

function isShared(file) {
  return SHARED_PREFIXES.some((prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix))
}

/**
 * @param {string[]} files
 * @param {{ site_app: string, site_server: string, image_tag: string }[]} catalog
 */
export function resolveImages(files, catalog) {
  const relevant = files.filter((file) => file && !isIgnored(file))
  if (relevant.length === 0) return []
  if (relevant.some(isShared)) return catalog

  const templates = workspacePackageNames("templates")
  const plugins = workspacePackageNames("plugins")
  const siteNames = new Map(catalog.map((row) => [row.site_app, siteWorkspaceNames(row.site_app)]))

  const selected = new Set()
  let unknownPackageChange = false

  for (const file of relevant) {
    const siteHit = catalog.find((row) => file === row.site_app || file.startsWith(`${row.site_app}/`))
    if (siteHit) {
      selected.add(siteHit.image_tag)
      continue
    }

    let pkgName = null
    for (const [prefix, name] of templates) {
      if (file.startsWith(prefix) || file === prefix.slice(0, -1)) {
        pkgName = name
        break
      }
    }
    if (!pkgName) {
      for (const [prefix, name] of plugins) {
        if (file.startsWith(prefix) || file === prefix.slice(0, -1)) {
          pkgName = name
          break
        }
      }
    }

    if (pkgName) {
      for (const row of catalog) {
        if (siteNames.get(row.site_app)?.has(pkgName)) {
          selected.add(row.image_tag)
        }
      }
      continue
    }

    unknownPackageChange = true
  }

  if (unknownPackageChange && selected.size === 0) return catalog
  return catalog.filter((row) => selected.has(row.image_tag))
}

function parseArgs(argv) {
  const args = { ref: "engine-v2", before: "", sha: "", force: false, files: null, selfTest: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--self-test") args.selfTest = true
    else if (a === "--force") args.force = true
    else if (a === "--ref") args.ref = argv[++i]
    else if (a === "--before") args.before = argv[++i]
    else if (a === "--sha") args.sha = argv[++i]
    else if (a === "--files") args.files = argv[++i]
  }
  return args
}

function zeroSha(sha) {
  return !sha || /^0+$/.test(sha)
}

function assert(cond, message) {
  if (!cond) throw new Error(message)
}

function selfTest() {
  const tags = (files) => resolveImages(files, ENGINE_V2_IMAGES).map((r) => r.image_tag)

  assert(tags(["packages/templates/sorfeszt/styles/sorfeszt-storefront.css"]).join() === "sorfeszt", "template-only")
  assert(
    tags(["packages/templates/world-darts-festival/chrome/WdfTicker.tsx"]).join() === "world-darts-festival",
    "wdf template-only"
  )
  assert(tags(["apps/dr-zsanett/next.config.ts"]).join() === "dr-zsanett", "site app only")
  assert(tags(["docs/README.md", "scripts/seed/sorfeszt-tbook.ts"]).length === 0, "docs/scripts ignored")
  assert(tags(["packages/templates/sakkmed/sakkmed.css"]).length === 0, "unused template skips GHCR")
  assert(tags([".github/workflows/docker-publish.yml"]).length === 0, "workflow-only skips images")

  const tbookPlugin = tags(["packages/plugins/t-book/lib/i18n.ts"])
  for (const needed of ["engine-v2", "world-darts-festival", "sorfeszt", "eventstructure", "engine-v2-reference"]) {
    assert(tbookPlugin.includes(needed), `t-book plugin should rebuild ${needed}`)
  }
  assert(!tbookPlugin.includes("dr-zsanett"), "t-book plugin should not rebuild dr-zsanett")

  const core = tags(["packages/core/src/features/template-cms/editors/TBookSurfaceVisualEditor.tsx"])
  assert(core.length === ENGINE_V2_IMAGES.length, "core rebuilds all")

  const mixed = tags(["packages/templates/sorfeszt/theme.ts", "packages/core/src/index.ts"])
  assert(mixed.length === ENGINE_V2_IMAGES.length, "core + template still rebuilds all")

  assert(tags(["deployments.config.json"]).length === 0, "deployments catalog alone skips images")
  assert(!ENGINE_V2_IMAGES.some((row) => row.image_tag === "es2"), "es2 removed from catalog")
  assert(!ENGINE_V2_IMAGES.some((row) => row.site_app.includes("sakkmed")), "sakkmed not in GHCR catalog")

  console.error("resolve-docker-matrix self-test ok")
}

function githubOutput(matrixRows) {
  const matrix = JSON.stringify({ include: matrixRows })
  const shouldBuild = matrixRows.length > 0
  process.stdout.write(`should_build=${shouldBuild}\n`)
  process.stdout.write("matrix<<MATRIX_EOF\n")
  process.stdout.write(`${matrix}\n`)
  process.stdout.write("MATRIX_EOF\n")
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.selfTest) {
    selfTest()
    return
  }

  const catalog = catalogForRef(args.ref)
  if (args.force || zeroSha(args.before)) {
    githubOutput(catalog)
    return
  }

  let files
  if (args.files) {
    files = args.files.split("\n").map((s) => s.trim()).filter(Boolean)
  } else {
    const { execFileSync } = await import("node:child_process")
    const range = args.before && args.sha ? [args.before, args.sha] : ["HEAD^", "HEAD"]
    const out = execFileSync("git", ["diff", "--name-only", ...range], {
      cwd: ROOT,
      encoding: "utf8",
    })
    files = out.split("\n").map((s) => s.trim()).filter(Boolean)
  }

  githubOutput(resolveImages(files, catalog))
}

const invokedDirectly = process.argv[1]?.replace(/\\/g, "/").endsWith("resolve-docker-matrix.mjs")
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
