#!/usr/bin/env node
/**
 * Batch-normalize legacy Krausz admin class strings across operator surfaces.
 * Safe, mechanical replacements only — structural refactors stay manual.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname

const SCAN_ROOTS = [
  "packages/admin/src/app/admin",
  "packages/core/src/components/admin",
  "packages/core/src/features/site-settings",
  "packages/core/src/features/template-cms/components",
  "packages/core/src/features/theme",
  "packages/core/src/features/homepage-cms",
  "packages/plugins",
]

const REPLACEMENTS = [
  [/text-4xl\s+text-3xl/g, "text-3xl"],
  [/text-3xl\s+font-black\s+text-white/g, "text-3xl font-bold text-foreground"],
  [/text-3xl\s+font-bold\s+text-white/g, "text-3xl font-bold text-foreground"],
  [/h-10\s+rounded-md\s+uppercase\s+text-\[10px\]\s+font-black\s+tracking-widest/g, "h-10"],
  [/h-11\s+rounded-md\s+uppercase\s+text-\[10px\]\s+font-black\s+tracking-widest/g, "h-11"],
  [/h-12\s+rounded-md\s+uppercase\s+text-\[10px\]\s+font-black\s+tracking-widest/g, "h-12"],
  [/uppercase\s+text-\[10px\]\s+font-black\s+tracking-widest/g, "text-sm font-medium"],
  [/text-\[10px\]\s+admin-link-accent\s+uppercase\s+tracking-widest/g, "text-sm text-primary font-medium"],
  [/text-\[10px\]\s+font-black\s+uppercase\s+tracking-widest/g, "text-xs font-medium text-muted-foreground"],
  [/font-black\s+uppercase\s+tracking-widest\s+text-\[10px\]/g, "text-xs font-medium text-muted-foreground"],
  [/text-\[10px\]\s+font-black\s+uppercase\s+tracking-\[0\.2em\]/g, "text-xs font-medium text-muted-foreground"],
  [/font-black\s+uppercase\s+tracking-\[0\.2em\]/g, "text-xs font-medium text-muted-foreground"],
  [/text-\[9px\]\s+font-black\s+uppercase\s+tracking-widest/g, "text-xs font-medium text-muted-foreground"],
  [/text-\[8px\]\s+font-black\s+uppercase\s+tracking-widest/g, "text-xs font-medium text-muted-foreground"],
  [/bg-white\/5\s+border\s+border-white\/10\s+rounded-2xl/g, "rounded-xl bg-card shadow-sm"],
  [/border\s+border-white\/10\s+bg-white\/5/g, "bg-card shadow-sm"],
  [/bg-muted\/50\s+border\s+border-border/g, "bg-muted/40"],
  [/divide-y\s+divide-white\/5/g, "divide-y divide-border/50"],
  [/hover:border-white\/30/g, "hover:shadow-md"],
  [/rounded-none/g, "rounded-md"],
  [/text-white\/40/g, "text-muted-foreground"],
  [/text-white\/60/g, "text-muted-foreground"],
  [/text-amber-200/g, "text-amber-900"],
  [/text-amber-300/g, "text-amber-800"],
  [/text-emerald-300/g, "text-emerald-800"],
  [/text-emerald-400/g, "text-emerald-800"],
  [/text-rose-200/g, "text-rose-800"],
  [/text-rose-300/g, "text-rose-800"],
  [/text-red-400/g, "text-destructive"],
  [/text-\[11px\]/g, "text-xs"],
  [/text-\[9px\]/g, "text-xs"],
  [/text-\[8px\]/g, "text-xs"],
  [/text-\[7px\]/g, "text-xs"],
  [/variant="krausz"/g, 'variant="default"'],
  [/font-heading\s+font-black\s+tracking-tight\s+uppercase\s+italic/g, "text-3xl font-bold tracking-tight"],
  [/text-4xl\s+font-extrabold\s+tracking-tight\s+uppercase\s+italic\s+text-white/g, "text-3xl font-bold tracking-tight text-foreground"],
  [/text-4xl\s+font-heading\s+font-black\s+tracking-tight\s+uppercase\s+italic\s+text-white/g, "text-3xl font-bold tracking-tight text-foreground"],
  [/h-9 px-2 bg-black border border-white\/20 text-sm text-white/g, "h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"],
  [/w-full h-9 px-2 bg-black border border-white\/20 text-sm text-white/g, "w-full h-9 rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"],
  [/w-full h-9 px-2 bg-black border border-white\/20 text-xs text-white font-mono/g, "w-full h-9 rounded-md border-0 bg-background/90 px-3 font-mono text-xs text-foreground ring-1 ring-border/60"],
  [/flex-1 min-h-\[72px\] px-2 py-1 bg-black border border-white\/20 text-sm text-white resize-y/g, "flex-1 min-h-[72px] resize-y rounded-md border-0 bg-background/90 px-3 py-2 text-sm text-foreground ring-1 ring-border/60"],
  [/flex-1 h-9 px-2 bg-black border border-white\/20 text-sm text-white/g, "flex-1 h-9 rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"],
  [/h-9 px-2 bg-black border border-white\/20 text-white text-sm/g, "h-9 rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"],
  [/px-3 h-9 border border-white\/20 text-white text-xs uppercase/g, "inline-flex h-9 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"],
  [/px-3 h-8 border border-white\/20 text-white text-xs uppercase/g, "inline-flex h-8 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"],
  [/px-3 h-9 border border-red-500\/60 text-red-200 text-xs uppercase/g, "inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-destructive ring-1 ring-destructive/40"],
  [/px-3 h-8 border border-red-500\/60 text-red-200 text-xs uppercase/g, "inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-destructive ring-1 ring-destructive/40"],
  [/py-20 border-b border-white\/10 bg-black\/20/g, "py-16 border-b border-border/40 bg-muted/20"],
  [/space-y-4 border border-white\/10 p-4/g, "space-y-4 rounded-lg bg-muted/40 p-4 ring-1 ring-border/40"],
  [/space-y-2 border border-white\/10 p-3/g, "space-y-2 rounded-lg bg-muted/40 p-3 ring-1 ring-border/40"],
  [/border border-white\/20 bg-black\/40/g, "rounded-lg bg-muted/40 ring-1 ring-border/40"],
  [/border border-white\/20 text-white text-xs uppercase/g, "rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"],
  [/text-xs uppercase tracking-widest text-neutral-400/g, "text-xs font-medium text-muted-foreground"],
  [/text-xs uppercase tracking-widest text-white/g, "text-xs font-semibold text-foreground"],
  [/text-xs uppercase tracking-widest text-neutral-500/g, "text-xs text-muted-foreground"],
  [/text-xs uppercase tracking-widest text-emerald-300\/90/g, "text-xs font-medium text-emerald-800"],
  [/border border-white\/10 p-3/g, "rounded-lg bg-muted/40 p-3 ring-1 ring-border/40"],
  [/h-9 w-full px-2 bg-black border border-white\/20 text-sm text-white/g, "h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"],
  [/h-9 w-24 px-2 bg-black border border-white\/20 text-sm text-white/g, "h-9 w-24 rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"],
  [/h-9 w-full bg-black border border-white\/20 px-2 text-sm text-white/g, "h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"],
  [/inline-flex h-9 cursor-pointer items-center justify-center gap-2 border border-white\/20 px-3 text-xs uppercase text-white/g, "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"],
  [/w-full min-h-\[80px\] px-2 py-2 bg-black border border-white\/20 text-sm text-white font-mono/g, "w-full min-h-[80px] rounded-md border-0 bg-background/90 px-3 py-2 font-mono text-sm text-foreground ring-1 ring-border/60"],
  [/py-8 border-b border-white\/10 bg-black\/20/g, "py-8 border-b border-border/40 bg-muted/20"],
  [/object-cover border border-white\/10/g, "object-cover ring-1 ring-border/40"],
  [/border border-dashed border-white\/20/g, "border border-dashed border-border/60"],
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue
      walk(path, out)
    } else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      out.push(path)
    }
  }
  return out
}

function shouldScan(file) {
  const rel = relative(ROOT, file)
  if (rel.startsWith("packages/plugins/") && !rel.includes("/admin/")) return false
  if (rel.includes("/storefront/")) return false
  return SCAN_ROOTS.some((r) => rel.startsWith(r))
}

let changed = 0
for (const root of SCAN_ROOTS.map((r) => join(ROOT, r))) {
  for (const file of walk(root)) {
    if (!shouldScan(file)) continue
    const before = readFileSync(file, "utf8")
    let after = before
    for (const [pattern, replacement] of REPLACEMENTS) {
      after = after.replace(pattern, replacement)
    }
    if (after !== before) {
      writeFileSync(file, after)
      changed++
      console.log(relative(ROOT, file))
    }
  }
}

console.log(`\nUpdated ${changed} files.`)
