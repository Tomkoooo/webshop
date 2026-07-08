import { promises as fs, existsSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { syncApp } from "./sync.mjs"

const VALID_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Plugins that ship Next.js routes (an `app/` dir) and can be installed on a site. */
const ROUTE_PLUGINS = ["shop", "camp-booking", "press-kit", "t-book"]

function parseArgs(argv) {
  const out = { plugins: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const eq = arg.indexOf("=")
    const key = eq === -1 ? arg : arg.slice(0, eq)
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1)
    if (key === "--name") out.name = value
    else if (key === "--template") out.template = value
    else if (key === "--deployment-key") out.deploymentKey = value
    else if (key === "--template-pin") out.templatePin = value
    else if (key === "--plugins") out.plugins = value.split(",").map((p) => p.trim()).filter(Boolean)
    else if (!arg.startsWith("--") && !out.name) {
      out.name = arg
      i-- // positional consumed no extra value
    }
  }
  return out
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

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.copyFile(src, dest)
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) await copyDir(s, d)
    else if (entry.isFile()) await fs.copyFile(s, d)
  }
}

function sitePackageJson(name, templateId, plugins) {
  const deps = {
    "@wse/admin": "*",
    "@wse/core": "*",
    "@wse/sdk": "*",
    [`@wse/template-${templateId}`]: "*",
  }
  for (const plugin of plugins) deps[`@wse/plugin-${plugin}`] = "*"
  return {
    name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev --webpack",
      build: "next build",
      start: "next start",
      sync: "node ../../packages/wse-cli/bin/wse.mjs sync",
    },
    dependencies: Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b))),
  }
}

function wseConfigJson(plugins) {
  const routeSources = [
    { specifier: "@wse/core/app", dir: "../../packages/core/src/app", injectGlobalsCss: true },
    { specifier: "@wse/admin/app", dir: "../../packages/admin/src/app" },
  ]
  for (const plugin of plugins) {
    routeSources.push({
      specifier: `@wse/plugin-${plugin}/app`,
      dir: `../../packages/plugins/${plugin}/app`,
    })
  }
  return { routeSources }
}

function siteConfigTs(name, templateId, plugins) {
  return `/**
 * Site identity for '${name}'. This file — not a DEPLOYMENT_KEY — declares
 * which template and plugins this deployment ships. \`wse sync\` reads
 * wse.config.json (kept in step with the plugins listed here) to generate
 * route stubs.
 */
export const siteConfig = {
  id: "${name}",
  templateId: "${templateId}",
  plugins: [${plugins.map((p) => `"${p}"`).join(", ")}] as const,
}
`
}

async function addDockerfileManifestCopy(repoRoot, name) {
  const dockerfilePath = path.join(repoRoot, "Dockerfile")
  if (!existsSync(dockerfilePath)) return
  let src = await fs.readFile(dockerfilePath, "utf8")
  const line = `COPY apps/${name}/package.json ./apps/${name}/`
  if (src.includes(line)) return
  src = src.replace(
    /(COPY apps\/[a-z0-9-]+\/package\.json \.\/apps\/[a-z0-9-]+\/\n)/,
    `$1${line}\n`
  )
  await fs.writeFile(dockerfilePath, src, "utf8")
  console.log(`[create-site] Added workspace manifest COPY to Dockerfile`)
}

export async function runCreateSite(args) {
  const opts = parseArgs(args)
  const name = opts.name?.trim()
  const templateId = (opts.template ?? "default-modern").trim()
  const plugins = opts.plugins

  if (!name || !VALID_NAME.test(name)) {
    console.error(
      "Usage: wse create-site --name <site-name> [--template <template-id>] [--plugins shop,press-kit]"
    )
    process.exit(1)
  }
  const badPlugin = plugins.find((p) => !ROUTE_PLUGINS.includes(p))
  if (badPlugin) {
    console.error(`Unknown plugin '${badPlugin}'. Available: ${ROUTE_PLUGINS.join(", ")}`)
    process.exit(1)
  }

  const repoRoot = findRepoRoot(process.cwd())
  const refDir = path.join(repoRoot, "apps/reference")
  const siteDir = path.join(repoRoot, "apps", name)

  if (!existsSync(path.join(repoRoot, "packages/templates", templateId))) {
    console.error(`Template '${templateId}' not found in packages/templates.`)
    process.exit(1)
  }
  if (existsSync(siteDir)) {
    console.error(`Destination already exists: ${siteDir}.`)
    process.exit(1)
  }

  console.log(`[create-site] Scaffolding apps/${name} (template: ${templateId}, plugins: ${plugins.join(", ") || "none"})`)

  // Shared config surface is copied from the reference app so all site apps
  // stay on one Next.js/Tailwind/TypeScript configuration.
  for (const file of [
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    "components.json",
    "next-env.d.ts",
  ]) {
    await copyFile(path.join(refDir, file), path.join(siteDir, file))
  }

  // Site identity is baked into the build via WSE_SITE_CONFIG_JSON — no
  // runtime DEPLOYMENT_KEY and no deployments.config.json row needed.
  // --deployment-key covers multi-container deployments sharing one identity
  // (with --template-pin fixing the template per container, e.g. Keramia).
  const deploymentKey = opts.deploymentKey?.trim() || name
  const siteConfigJson = JSON.stringify({
    id: deploymentKey,
    label: name,
    templateId,
    plugins,
  })
  const envLines = [`    WSE_SITE_CONFIG_JSON: ${JSON.stringify(siteConfigJson)},`]
  if (opts.templatePin?.trim()) envLines.push(`    TEMPLATE_PIN: "${opts.templatePin.trim()}",`)
  const nextConfigPath = path.join(siteDir, "next.config.ts")
  let nextConfig = await fs.readFile(nextConfigPath, "utf8")
  nextConfig = nextConfig.replace(
    /(const nextConfig: NextConfig = \{\n)/,
    `$1  env: {\n${envLines.join("\n")}\n  },\n`
  )
  await fs.writeFile(nextConfigPath, nextConfig, "utf8")
  await copyFile(path.join(refDir, "src/middleware.ts"), path.join(siteDir, "src/middleware.ts"))
  await copyFile(
    path.join(refDir, "src/app/globals.css"),
    path.join(siteDir, "src/app/globals.css")
  )
  await copyDir(path.join(refDir, "public"), path.join(siteDir, "public"))

  await fs.writeFile(
    path.join(siteDir, "package.json"),
    JSON.stringify(sitePackageJson(name, templateId, plugins), null, 2) + "\n"
  )
  await fs.writeFile(
    path.join(siteDir, "wse.config.json"),
    JSON.stringify(wseConfigJson(plugins), null, 2) + "\n"
  )
  await fs.mkdir(path.join(siteDir, "src/site"), { recursive: true })
  await fs.writeFile(path.join(siteDir, "src/site/site.config.ts"), siteConfigTs(name, templateId, plugins))

  const result = syncApp(siteDir)
  console.log(
    `[create-site] wse sync: ${result.total} routes — wrote ${result.written} stubs`
  )

  await addDockerfileManifestCopy(repoRoot, name)

  console.log(`[create-site] Done. Next steps:`)
  console.log(`  1. Run: npm install  (links the new workspace)`)
  console.log(`  2. Add apps/${name}/.env (or symlink the root .env: ln -s ../../.env apps/${name}/.env) with DATABASE_URL, AUTH_*, etc.`)
  console.log(`  3. Dev: npm run dev --workspace=apps/${name}`)
  console.log(`  4. Docker build: docker build --build-arg SITE_APP=apps/${name} --build-arg SITE_APP_SERVER=apps/${name}/server.js -t ${name} .`)
  console.log(`  5. After engine upgrades, re-run: npm run sync --workspace=apps/${name}`)
}
