#!/usr/bin/env node
/**
 * Export SAKKMED Stagecraft as a portable Next.js package:
 * - Live CMS JSON from Mongo (page:home + static pages + branding/theme/footer)
 * - Referenced /api/media/* binaries → public/media/
 * - Design source-of-truth copy from packages/templates/sakkmed
 * - Runnable minimal Next app that renders the homepage from content/home.json
 *
 * Usage (from repo root):
 *   node scripts/export/sakkmed-standalone.mjs
 *
 * Output: exports/sakkmed-standalone/
 */
import mongoose from "mongoose"
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, basename } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "../..")
const outDir = join(root, "exports/sakkmed-standalone")
const TEMPLATE_ID = "sakkmed"

try {
  const env = readFileSync(join(root, ".env"), "utf8")
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (!m) continue
    // Export always prefers repo .env (shell may inherit another site's DATABASE_URL).
    process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
  }
} catch {
  /* no .env */
}

// Prefer EXPORT_DB_URL, then DATABASE_URL. Do NOT use SEED_DB_URL — that often
// points at another customer DB for one-off seeds.
const uri = process.env.EXPORT_DB_URL || process.env.DATABASE_URL
if (!uri) {
  console.error("EXPORT_DB_URL or DATABASE_URL required")
  process.exit(1)
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true })
}

function writeJson(path, data) {
  ensureDir(dirname(path))
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n")
}

function collectMediaRefs(node, out = new Set()) {
  if (!node) return out
  if (typeof node === "string") {
    const m = node.match(/^\/api\/media\/([^/?#]+)/)
    if (m) out.add(m[1])
    return out
  }
  if (Array.isArray(node)) {
    for (const item of node) collectMediaRefs(item, out)
    return out
  }
  if (typeof node === "object") {
    for (const v of Object.values(node)) collectMediaRefs(v, out)
  }
  return out
}

function rewriteMediaPaths(node) {
  if (!node) return node
  if (typeof node === "string") {
    return node.replace(/^\/api\/media\//, "/media/")
  }
  if (Array.isArray(node)) return node.map(rewriteMediaPaths)
  if (typeof node === "object") {
    const next = {}
    for (const [k, v] of Object.entries(node)) next[k] = rewriteMediaPaths(v)
    return next
  }
  return node
}

function parseMaybeJson(value) {
  if (value == null) return null
  if (typeof value === "object") return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

async function main() {
  console.log("Connecting", uri.replace(/\/\/([^@]+)@/, "//***@"))
  await mongoose.connect(uri)
  const db = mongoose.connection.db

  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
  ensureDir(outDir)
  ensureDir(join(outDir, "content/pages"))
  ensureDir(join(outDir, "public/media"))
  ensureDir(join(outDir, "public/sakkmed"))
  ensureDir(join(outDir, "source"))
  ensureDir(join(outDir, "app"))
  ensureDir(join(outDir, "components"))

  const pages = await db
    .collection("templatecontents")
    .find({ templateId: TEMPLATE_ID, pageKey: /^page:/ })
    .toArray()

  const allMedia = new Set()
  const contentIndex = []

  for (const doc of pages) {
    const parsed = parseMaybeJson(doc.value) ?? parseMaybeJson(doc.draftValue)
    if (!parsed) {
      console.warn("skip empty", doc.pageKey)
      continue
    }
    collectMediaRefs(parsed, allMedia)
    const rewritten = rewriteMediaPaths(parsed)
    const slug = doc.pageKey.replace(/^page:/, "")
    if (slug === "home") {
      writeJson(join(outDir, "content/home.json"), rewritten)
    } else {
      writeJson(join(outDir, `content/pages/${slug}.json`), rewritten)
    }
    contentIndex.push({
      pageKey: doc.pageKey,
      slug,
      publishedAt: doc.publishedAt ?? null,
      updatedAt: doc.updatedAt ?? null,
    })
    console.log("wrote", doc.pageKey)
  }

  const branding =
    (await db.collection("brandingsettings").findOne({ key: "branding" })) ||
    (await db.collection("brandingsettings").findOne({}))
  if (branding) {
    collectMediaRefs(branding, allMedia)
    writeJson(join(outDir, "content/branding.json"), {
      brandName: branding.brandName ?? "SAKKMED 2005 Kft.",
      logoNav: rewriteMediaPaths(branding.logoNav || ""),
      logoFooter: rewriteMediaPaths(branding.logoFooter || ""),
      logoHero: rewriteMediaPaths(branding.logoHero || ""),
    })
  }

  const theme =
    (await db.collection("themesettings").findOne({ key: "theme" })) ||
    (await db.collection("themesettings").findOne({}))
  if (theme?.tokens) {
    writeJson(join(outDir, "content/theme.json"), theme.tokens)
  } else {
    writeJson(join(outDir, "content/theme.json"), {
      primary: "#C9A227",
      primaryForeground: "#0A0A0A",
      secondary: "#1A1A1A",
      secondaryForeground: "#F5F5F5",
      accent: "#E8C547",
      accentForeground: "#0A0A0A",
      background: "#0B0B0C",
      foreground: "#F5F5F5",
      surface: "#141416",
      surfaceForeground: "#F5F5F5",
      border: "#2A2A2E",
      muted: "#1E1E22",
      mutedForeground: "#A3A3AD",
    })
  }

  const footer =
    (await db.collection("footersettings").findOne({ key: "footer:sakkmed" })) ||
    (await db.collection("footersettings").findOne({ key: "footer" }))
  if (footer) {
    const { _id, __v, createdAt, updatedAt, ...rest } = footer
    writeJson(join(outDir, "content/footer.json"), rest)
  }

  writeJson(join(outDir, "content/index.json"), {
    exportedAt: new Date().toISOString(),
    templateId: TEMPLATE_ID,
    database: db.databaseName,
    pages: contentIndex,
    mediaCount: allMedia.size,
    instructionsForAi: [
      "Do NOT redesign or rewrite copy.",
      "UI source of truth is ./source/ (copied from packages/templates/sakkmed).",
      "Published CMS payloads are in ./content/ (media paths rewritten to /media/).",
      "Runnable homepage is app/page.tsx + components/HomeLanding.tsx — keep layout parity with source/pages/home/blocks/SakkmedHomeSections.tsx.",
    ],
  })

  console.log(`Exporting ${allMedia.size} media files…`)
  let mediaOk = 0
  for (const filename of allMedia) {
    const doc = await db.collection("media").findOne({ filename })
    if (!doc?.data) {
      console.warn("missing media", filename)
      continue
    }
    const buf = Buffer.isBuffer(doc.data)
      ? doc.data
      : Buffer.from(doc.data.buffer || doc.data)
    writeFileSync(join(outDir, "public/media", filename), buf)
    mediaOk++
  }
  console.log(`media written: ${mediaOk}/${allMedia.size}`)

  const publicSrc = join(root, "apps/sakkmed/public/sakkmed")
  if (existsSync(publicSrc)) {
    cpSync(publicSrc, join(outDir, "public/sakkmed"), { recursive: true })
    console.log("copied public/sakkmed fallbacks")
  }

  const templateSrc = join(root, "packages/templates/sakkmed")
  cpSync(templateSrc, join(outDir, "source"), {
    recursive: true,
    filter: (src) => !src.includes("node_modules"),
  })
  console.log("copied template source → source/")

  // Minimal runnable Next scaffold
  copyScaffold(outDir)

  await mongoose.disconnect()
  console.log("\nDone →", outDir)
  console.log("Run: cd exports/sakkmed-standalone && npm i && npm run dev")
}

function copyScaffold(outDir) {
  writeFileSync(
    join(root, "packages/templates/sakkmed/sakkmed.css"),
    join(outDir, "app/sakkmed.css")
  )

  writeFileSync(join(outDir, "package.json"), JSON.stringify({
    name: "sakkmed-standalone",
    private: true,
    version: "1.0.0",
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: {
      next: "^15.5.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
    devDependencies: {
      "@types/node": "^22.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      typescript: "^5.8.0",
    },
  }, null, 2) + "\n")

  writeFileSync(
    join(outDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        exclude: ["node_modules", "source"],
      },
      null,
      2
    ) + "\n"
  )

  writeFileSync(
    join(outDir, "next.config.mjs"),
    `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
}
export default nextConfig
`
  )

  writeFileSync(
    join(outDir, "next-env.d.ts"),
    `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`
  )

  writeFileSync(
    join(outDir, "app/globals.css"),
    `@import "./sakkmed.css";
@import "./utilities.css";

:root {
  --background: #0b0b0c;
  --foreground: #f5f5f5;
  --primary: #c9a227;
  --primary-foreground: #0a0a0a;
  --accent: #e8c547;
  --accent-foreground: #0a0a0a;
  --surface: #141416;
  --muted: #1e1e22;
  --muted-foreground: #a3a3ad;
  --border: #2a2a2e;
  --sm-body-muted: #c4c4cc;
  --sm-deep: #070708;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--background); color: var(--foreground); font-family: "Outfit", system-ui, sans-serif; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; display: block; }
button, summary { font: inherit; color: inherit; background: none; border: 0; }
details summary::-webkit-details-marker { display: none; }
`
  )

  writeFileSync(
    join(outDir, "app/utilities.css"),
    `/* Minimal utility layer so the export runs without Tailwind */
.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.inset-0{inset:0}
.left-0{left:0}.right-0{right:0}.top-0{top:0}.bottom-8{bottom:2rem}.left-6{left:1.5rem}
.z-10{z-index:10}.z-50{z-index:50}
.mx-auto{margin-left:auto;margin-right:auto}.mb-3{margin-bottom:.75rem}.mb-4{margin-bottom:1rem}.mb-8{margin-bottom:2rem}.mb-10{margin-bottom:2.5rem}.mb-12{margin-bottom:3rem}.mb-14{margin-bottom:3.5rem}.mt-2{margin-top:.5rem}.mt-3{margin-top:.75rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.mt-8{margin-top:2rem}.mt-12{margin-top:3rem}
.flex{display:flex}.grid{display:grid}.hidden{display:none}.block{display:block}
.h-1{height:.25rem}.h-9{height:2.25rem}.h-12{height:3rem}.h-full{height:100%}.min-h-11{min-height:2.75rem}.min-h-12{min-height:3rem}.min-h-14{min-height:3.5rem}.min-h-\\[55svh\\]{min-height:55svh}.min-h-\\[100svh\\]{min-height:100svh}
.w-1{width:.25rem}.w-auto{width:auto}.w-full{width:100%}.max-w-2xl{max-width:42rem}.max-w-3xl{max-width:48rem}.max-w-6xl{max-width:72rem}
.shrink-0{flex-shrink:0}.flex-1{flex:1}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}
.items-center{align-items:center}.justify-between{justify-content:space-between}.justify-end{justify-content:flex-end}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-6{gap:1.5rem}.gap-x-8{column-gap:2rem}
.overflow-hidden{overflow:hidden}.object-contain{object-fit:contain}.object-cover{object-fit:cover}
.rounded-full{border-radius:9999px}.rounded-xl{border-radius:.75rem}.rounded-2xl{border-radius:1rem}
.border{border:1px solid var(--border)}.border-b{border-bottom:1px solid var(--border)}.border-t{border-top:1px solid var(--border)}.border-y{border-top:1px solid var(--border);border-bottom:1px solid var(--border)}.border-l-2{border-left:2px solid}
.border-border\\/30{border-color:rgb(42 42 46 / .3)}.border-border\\/40{border-color:rgb(42 42 46 / .4)}.border-primary\\/25{border-color:rgb(201 162 39 / .25)}.border-primary\\/30{border-color:rgb(201 162 39 / .3)}.border-primary\\/40{border-color:rgb(201 162 39 / .4)}.border-primary\\/60{border-color:rgb(201 162 39 / .6)}.border-foreground\\/10{border-color:rgb(245 245 245 / .1)}.border-foreground\\/25{border-color:rgb(245 245 245 / .25)}
.bg-primary{background:var(--primary)}.bg-primary\\/10{background:rgb(201 162 39 / .1)}.bg-black\\/25{background:rgb(0 0 0 / .25)}.bg-black\\/30{background:rgb(0 0 0 / .3)}.bg-muted\\/10{background:rgb(30 30 34 / .1)}.bg-\\[var\\(--sm-deep\\)\\]{background:var(--sm-deep)}
.bg-gradient-to-b{background-image:linear-gradient(to bottom,var(--tw-gradient-stops,transparent))}.bg-gradient-to-t{background-image:linear-gradient(to top,var(--tw-gradient-stops,transparent))}
.from-black\\/70{--tw-gradient-from:rgb(0 0 0 / .7);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,transparent)}.from-black\\/80{--tw-gradient-from:rgb(0 0 0 / .8);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,transparent)}.via-transparent{--tw-gradient-stops:var(--tw-gradient-from),transparent,var(--tw-gradient-to,transparent)}.via-black\\/20{--tw-gradient-stops:var(--tw-gradient-from),rgb(0 0 0 / .2),var(--tw-gradient-to,transparent)}.to-\\[var\\(--sm-deep\\)\\]{--tw-gradient-to:var(--sm-deep)}.to-transparent{--tw-gradient-to:transparent}
.p-4{padding:1rem}.p-5{padding:1.25rem}.p-6{padding:1.5rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-2\\.5{padding-top:.625rem;padding-bottom:.625rem}.py-3{padding-top:.75rem;padding-bottom:.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.py-16{padding-top:4rem;padding-bottom:4rem}.py-20{padding-top:5rem;padding-bottom:5rem}.pb-2{padding-bottom:.5rem}.pb-5{padding-bottom:1.25rem}.pb-16{padding-bottom:4rem}.pt-3{padding-top:.75rem}.pt-28{padding-top:7rem}.pl-4{padding-left:1rem}
.text-left{text-align:left}.text-center{text-align:center}.text-\\[10px\\]{font-size:10px}.text-xs{font-size:.75rem}.text-sm{font-size:.875rem}.text-lg{font-size:1.125rem}.text-3xl{font-size:1.875rem}.text-\\[clamp\\(1\\.75rem\\,3\\.2vw\\,3\\.25rem\\)\\]{font-size:clamp(1.75rem,3.2vw,3.25rem)}.text-\\[clamp\\(1\\.75rem\\,4\\.5vw\\,3\\.75rem\\)\\]{font-size:clamp(1.75rem,4.5vw,3.75rem)}.text-\\[clamp\\(2rem\\,4vw\\,3\\.25rem\\)\\]{font-size:clamp(2rem,4vw,3.25rem)}.text-\\[clamp\\(2\\.75rem\\,8vw\\,7\\.5rem\\)\\]{font-size:clamp(2.75rem,8vw,7.5rem)}
.font-light{font-weight:300}.font-semibold{font-weight:600}.uppercase{text-transform:uppercase}.tracking-\\[0\\.12em\\]{letter-spacing:.12em}.tracking-\\[0\\.14em\\]{letter-spacing:.14em}.tracking-\\[0\\.16em\\]{letter-spacing:.16em}.tracking-wide{letter-spacing:.025em}.leading-relaxed{line-height:1.625}.whitespace-pre-line{white-space:pre-line}
.text-foreground{color:var(--foreground)}.text-foreground\\/90{color:rgb(245 245 245 / .9)}.text-primary{color:var(--primary)}.text-primary-foreground{color:var(--primary-foreground)}.text-muted-foreground{color:var(--muted-foreground)}.text-\\[var\\(--sm-body-muted\\)\\]{color:var(--sm-body-muted)}
.opacity-80{opacity:.8}.shadow-xl{box-shadow:0 20px 40px rgb(0 0 0 / .4)}.backdrop-blur-sm{backdrop-filter:blur(8px)}.list-none{list-style:none}.cursor-pointer{cursor:pointer}
.columns-1{columns:1}.break-inside-avoid{break-inside:avoid}.last\\:border-0:last-child{border:0}.last\\:pb-0:last-child{padding-bottom:0}
.hover\\:text-primary:hover{color:var(--primary)}.hover\\:bg-muted:hover{background:var(--muted)}.group:hover .group-hover\\:scale-105{transform:scale(1.05)}.transition{transition:.3s ease}.duration-700{transition-duration:.7s}
@media (min-width:640px){.sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.sm\\:columns-2{columns:2}}
@media (min-width:768px){.md\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.md\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.md\\:gap-4{gap:1rem}.md\\:pb-24{padding-bottom:6rem}.md\\:py-28{padding-top:7rem;padding-bottom:7rem}.md\\:text-xl{font-size:1.25rem}.md\\:text-5xl{font-size:3rem}.md\\:leading-\\[1\\.65\\]{line-height:1.65}.md\\:bottom-12{bottom:3rem}.md\\:left-12{left:3rem}.md\\:min-h-\\[70svh\\]{min-height:70svh}.md\\:hidden{display:none}.md\\:px-5{padding-left:1.25rem;padding-right:1.25rem}}
@media (min-width:1024px){.lg\\:flex{display:flex}.lg\\:hidden{display:none}.lg\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.lg\\:columns-3{columns:3}}
@media (min-width:1280px){.xl\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
`
  )

  writeFileSync(
    join(outDir, "app/layout.tsx"),
    `import type { Metadata } from "next"
import "./globals.css"
import branding from "../content/branding.json"
import home from "../content/home.json"

export const metadata: Metadata = {
  title: home.meta?.seoTitle || branding.brandName || "SAKKMED",
  description: home.meta?.seoDescription || "",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body className="sakkmed-root">{children}</body>
    </html>
  )
}
`
  )

  writeFileSync(
    join(outDir, "app/page.tsx"),
    `import home from "../content/home.json"
import branding from "../content/branding.json"
import { HomeLanding } from "../components/HomeLanding"
import { SiteChrome } from "../components/SiteChrome"

export default function Page() {
  return (
    <>
      <SiteChrome brandName={branding.brandName} logoSrc={branding.logoNav} />
      <HomeLanding snapshot={home as any} />
    </>
  )
}
`
  )

  // Write simplified chrome + home (CMS-free, layout-aligned with Stagecraft fixes)
  writeFileSync(join(outDir, "components/SiteChrome.tsx"), SITE_CHROME_SRC)
  writeFileSync(join(outDir, "components/HomeLanding.tsx"), HOME_LANDING_SRC)

  writeFileSync(
    join(outDir, "README.md"),
    `# SAKKMED Stagecraft — standalone export

Portable Next.js package with **live CMS content** + **design source of truth**.

## Quick start

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000

## What's inside

| Path | Purpose |
| --- | --- |
| \`content/home.json\` | Published homepage snapshot from Mongo |
| \`content/pages/*.json\` | Static service/project pages |
| \`content/branding.json\` / \`theme.json\` / \`footer.json\` | Brand + tokens |
| \`public/media/\` | Exported DB media (\`/api/media/…\` → \`/media/…\`) |
| \`public/sakkmed/\` | Static fallback images from the site app |
| \`source/\` | **Exact** \`packages/templates/sakkmed\` copy — do not redesign from scratch |
| \`components/HomeLanding.tsx\` | Runnable CMS-free homepage matching Stagecraft layouts |
| \`content/index.json\` | Export metadata + AI instructions |

## For AI agents (Claude Code, Cursor, …)

1. **Do not reconstruct or invent a new design.**
2. Treat \`source/\` as the visual + interaction source of truth.
3. Treat \`content/*.json\` as immutable copy/images (paths already rewritten to \`/media/\`).
4. If you need static pages, mirror \`source/static-pages/shared/Render.tsx\` and load \`content/pages/<slug>.json\`.

Re-export from the monorepo anytime:

\`\`\`bash
node scripts/export/sakkmed-standalone.mjs
\`\`\`
`
  )

  writeFileSync(
    join(outDir, "AGENTS.md"),
    `# Agent instructions — SAKKMED standalone

This folder is an **export of a finished site**, not a brief to redesign.

- UI truth: \`source/\` (copied from engine template \`sakkmed\`)
- Content truth: \`content/\` (Mongo published payloads)
- Media: \`public/media/\`

Forbidden: rewriting headlines, inventing sections, replacing the layout system with a generic landing template.

Allowed: wiring \`content/pages/*.json\` into routes, fixing broken imports, adapting image paths, packaging for deploy.
`
  )
}

const SITE_CHROME_SRC = `"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

const NAV = [
  { label: "Főoldal", href: "/" },
  { label: "Rólunk", href: "/#about" },
  { label: "Galéria", href: "/#gallery" },
  { label: "Kapcsolat", href: "/#contact" },
] as const

const SERVICES = [
  { label: "Bútoraink", href: "/butoraink" },
  { label: "Installációk", href: "/installaciok" },
  { label: "Traverz", href: "/traverz" },
  { label: "Layher", href: "/layher" },
  { label: "Emeléstechnika", href: "/emelestechnika" },
  { label: "Alutent", href: "/alutent" },
  { label: "Áramhálózat", href: "/aramhalozat" },
  { label: "Vízmű", href: "/vizmu" },
  { label: "Syma", href: "/syma" },
] as const

export function SiteChrome({ brandName, logoSrc }: { brandName: string; logoSrc?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 md:px-5">
      <div
        className={
          "sakkmed-glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-4 py-2.5 " +
          (scrolled ? "border-primary/25" : "border-foreground/10 bg-black/25")
        }
      >
        <Link href="/" className="flex min-h-11 items-center gap-3">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={brandName} className="h-9 w-auto object-contain" />
          ) : (
            <span className="sakkmed-display text-sm tracking-[0.12em] uppercase">{brandName}</span>
          )}
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Fő navigáció">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-10 items-center rounded-full px-3 text-sm hover:text-primary">
              {l.label}
            </Link>
          ))}
          <details className="relative">
            <summary className="sakkmed-focus cursor-pointer list-none rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Szolgáltatásaink
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-border bg-background py-2 shadow-xl">
              {SERVICES.map((s) => (
                <Link key={s.href} href={s.href} className="block px-4 py-2 text-sm hover:bg-muted hover:text-primary">
                  {s.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>
        <button type="button" className="lg:hidden rounded-full border border-border px-3 py-2 text-sm" onClick={() => setOpen((v) => !v)}>
          Menü
        </button>
      </div>
      {open ? (
        <nav className="sakkmed-glass mx-auto mt-2 max-w-6xl rounded-2xl p-4 lg:hidden">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="block py-2" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {SERVICES.map((s) => (
            <Link key={s.href} href={s.href} className="block py-2 text-sm text-[var(--sm-body-muted)]" onClick={() => setOpen(false)}>
              {s.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  )
}
`

const HOME_LANDING_SRC = `"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type Block = { id: string; type: string; enabled?: boolean; data: any }
type Snapshot = { blocks: Block[]; meta?: { seoTitle?: string; seoDescription?: string } }

const SERVICE_LINKS = [
  { label: "Bútoraink", href: "/butoraink" },
  { label: "Installációk", href: "/installaciok" },
  { label: "Traverz", href: "/traverz" },
  { label: "Layher", href: "/layher" },
  { label: "Emeléstechnika", href: "/emelestechnika" },
  { label: "Alutent", href: "/alutent" },
  { label: "Áramhálózat", href: "/aramhalozat" },
  { label: "Vízmű", href: "/vizmu" },
  { label: "Syma", href: "/syma" },
] as const

const PROJECT_LINKS = [
  { label: "Fesztivál VIP", href: "/fesztival-vip" },
  { label: "Sigma konténer", href: "/sigma-kontener" },
] as const

function block(snapshot: Snapshot, type: string, id: string) {
  return snapshot.blocks.find((b) => b.type === type && b.id === id && b.enabled !== false)
}

function splitPipe(value: string) {
  return value.split(/\\s*\\|\\s*/).map((s) => s.trim()).filter(Boolean)
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function PipeList({ value }: { value: string }) {
  const chips = splitPipe(value)
  if (chips.length <= 1) return <span className="whitespace-pre-line">{value}</span>
  return (
    <ul className="mt-3 space-y-2">
      {chips.map((chip) => (
        <li key={chip} className="flex gap-2 border-b border-border/30 pb-2 text-sm text-[var(--sm-body-muted)] last:border-0 last:pb-0">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
          <span>{chip}</span>
        </li>
      ))}
    </ul>
  )
}

export function HomeLanding({ snapshot }: { snapshot: Snapshot }) {
  const hero = block(snapshot, "hero", "hero-sakkmed")?.data
  const services = block(snapshot, "features", "services-sakkmed")?.data
  const about = block(snapshot, "about", "about-sakkmed")?.data
  const projects = block(snapshot, "gallery", "projects-sakkmed")?.data
  const clients = block(snapshot, "gallery", "clients-sakkmed")?.data
  const gallery = block(snapshot, "gallery", "gallery-sakkmed")?.data
  const contact = block(snapshot, "contact", "contact-sakkmed")?.data
  const [openAcc, setOpenAcc] = useState(0)

  const galleryItems = gallery?.items || []

  return (
    <main>
      <section className="sakkmed-grain relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero?.heroImage || ""} alt="" className="sakkmed-kenburns h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-[var(--sm-deep)]" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:pb-24">
          <p className="sakkmed-kicker mb-4 md:hidden">{hero?.badges?.[0]}</p>
          <h1 className="sakkmed-display text-[clamp(2.75rem,8vw,7.5rem)] uppercase text-foreground">{hero?.title}</h1>
          <p className="sakkmed-display mt-2 whitespace-pre-line text-[clamp(1.75rem,4.5vw,3.75rem)] font-light uppercase tracking-[0.12em] text-foreground/90">
            {hero?.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={hero?.primaryCtaHref || "#contact"} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              {hero?.primaryCtaLabel || "Kapcsolat"}
            </Link>
            <Link href={hero?.secondaryCtaHref || "#services"} className="rounded-full border border-foreground/25 bg-black/30 px-6 py-3 text-sm font-semibold backdrop-blur-sm">
              {hero?.secondaryCtaLabel || "Szolgáltatások"}
            </Link>
          </div>
        </div>
      </section>

      <section id="services" className="sakkmed-section border-b border-border/40 py-20 md:py-28">
        <div className="sakkmed-page">
          <div className="mb-12 max-w-2xl">
            <h2 className="sakkmed-display text-[clamp(1.75rem,3.2vw,3.25rem)]">{services?.title}</h2>
            <p className="mt-4 text-[var(--sm-body-muted)]">{services?.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(services?.cards || []).map((card: any, idx: number) => (
              <article key={idx} className="sakkmed-glass flex h-full flex-col rounded-2xl p-6">
                <p className="sakkmed-mono mb-3 text-[10px] text-muted-foreground">{pad(idx + 1)}</p>
                <h3 className="text-lg font-semibold uppercase tracking-wide text-primary">{card.title}</h3>
                <div className="mt-3 flex-1"><PipeList value={card.description || ""} /></div>
              </article>
            ))}
          </div>
          <div className="mt-12 grid gap-x-8 border-t border-primary/30 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_LINKS.map((link, i) => (
              <Link key={link.href} href={link.href} className="flex min-h-12 items-center justify-between border-b border-border/40 py-3 text-sm uppercase tracking-[0.14em] hover:text-primary">
                <span className="flex items-center gap-3">
                  <span className="sakkmed-mono text-xs text-muted-foreground">{pad(i + 1)}</span>
                  {link.label}
                </span>
                <span>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="sakkmed-section border-b border-border/40 bg-muted/10 py-20 md:py-28">
        <div className="sakkmed-page">
          <h2 className="sakkmed-display mb-12 text-[clamp(1.75rem,3.2vw,3.25rem)]">{about?.title}</h2>
          <div className="mb-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {(about?.cards || []).map((card: any, idx: number) => (
              <div key={idx} className="sakkmed-glass rounded-2xl px-4 py-6 text-center">
                <p className="sakkmed-display text-[clamp(2rem,4vw,3.25rem)] text-primary">{card.title}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{card.description}</p>
              </div>
            ))}
          </div>
          {about?.paragraph ? (
            <p className="mx-auto mb-14 max-w-3xl text-center text-lg font-light leading-relaxed md:text-xl md:leading-[1.65]">
              {about.paragraph}
            </p>
          ) : null}
          <div className="space-y-2 border-t border-border/40">
            {(about?.accordions || []).map((item: any, idx: number) => {
              const open = openAcc === idx
              return (
                <div key={idx} className="border-b border-border/40">
                  <button type="button" className="flex min-h-14 w-full items-center justify-between py-4 text-left" onClick={() => setOpenAcc(open ? -1 : idx)}>
                    <span className="font-semibold text-primary">{item.title}</span>
                    <span className="sakkmed-mono text-xs">{open ? "−" : "+"}</span>
                  </button>
                  {open ? (
                    <div className="pb-5">
                      <PipeList value={item.content || ""} />
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="projects" className="sakkmed-section">
        <div className="sakkmed-page py-16">
          <h2 className="sakkmed-display mb-8 text-[clamp(1.75rem,3.2vw,3.25rem)]">{projects?.title}</h2>
        </div>
        {(projects?.items || []).map((item: any, idx: number) => (
          <Link key={idx} href={PROJECT_LINKS[idx]?.href || "#"} className="group relative block min-h-[55svh] overflow-hidden md:min-h-[70svh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.caption || ""} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <p className="absolute bottom-8 left-6 sakkmed-display text-3xl text-foreground md:bottom-12 md:left-12 md:text-5xl">{item.caption}</p>
          </Link>
        ))}
      </section>

      <section id="clients" className="sakkmed-section border-y border-border/40 py-16">
        <h2 className="mb-8 text-center sakkmed-kicker">{clients?.title}</h2>
        <div className="sakkmed-page grid grid-cols-2 gap-6 md:grid-cols-4">
          {(clients?.items || []).map((item: any, idx: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={idx} src={item.image} alt={item.caption || "Partner"} className="mx-auto h-12 w-auto object-contain opacity-80" />
          ))}
        </div>
      </section>

      <section id="gallery" className="sakkmed-section bg-[var(--sm-deep)] py-20">
        <div className="sakkmed-page">
          <h2 className="sakkmed-display mb-8 text-[clamp(1.75rem,3.2vw,3.25rem)]">{gallery?.title}</h2>
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
            {galleryItems.map((item: any, idx: number) => (
              <figure key={idx} className="mb-3 break-inside-avoid overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.caption || ""} className="w-full object-cover" loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="sakkmed-section py-20 md:py-28">
        <div className="sakkmed-page">
          <h2 className="sakkmed-display mb-10 text-[clamp(1.75rem,3.2vw,3.25rem)]">{contact?.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="sakkmed-glass sakkmed-gold-rim rounded-2xl p-5 text-sm whitespace-pre-line">
              <h3 className="font-semibold text-primary">{contact?.warehouseTitle}</h3>
              <p className="mt-2 text-[var(--sm-body-muted)]">{contact?.warehouseBody}</p>
            </div>
            <div className="sakkmed-glass rounded-2xl p-5 text-sm">
              <h3 className="font-semibold text-primary">Központi iroda</h3>
              <p className="mt-2">{contact?.companyName}</p>
              <p>{contact?.address}</p>
              <p className="text-muted-foreground">{contact?.officeTaxId}</p>
              <p className="mt-2">{contact?.officeManagerLine}</p>
            </div>
            <div className="sakkmed-glass rounded-2xl p-5 text-sm whitespace-pre-line">
              <h3 className="font-semibold text-primary">BTL Ügynökség Kft.</h3>
              <p className="mt-2 text-[var(--sm-body-muted)]">{contact?.btlBlock}</p>
            </div>
            <div className="sakkmed-glass rounded-2xl p-5 text-sm">
              <h3 className="font-semibold text-primary">Pénzügy</h3>
              <p className="mt-2 text-[var(--sm-body-muted)]">{contact?.financeBlock}</p>
            </div>
          </div>
          {contact?.description ? (
            <p className="mt-6 border-l-2 border-primary/60 pl-4 text-sm text-[var(--sm-body-muted)]">{contact.description}</p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
`

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
