import fs from "node:fs"
import path from "node:path"

/**
 * Template CMS/theme lint. Error codes:
 *   WSE101 hardcoded color (raw hex, arbitrary color class, or raw Tailwind palette class)
 *   WSE102 forbidden theme-token pairing on one element
 *   WSE103 page Render without CMS wiring (no Cms or Editable primitives)
 *   WSE104 defaultTheme missing required tokens
 *   WSE105 defaultTheme fails contrast rules
 *
 * Shares its rule set with @wse/sdk/theme/rules (kept in sync — the SDK version
 * powers the admin editor UI, this JS version powers CI).
 */

const THEME_TOKEN_KEYS = [
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "accent",
  "accentForeground",
  "background",
  "foreground",
  "surface",
  "surfaceForeground",
  "border",
  "muted",
  "mutedForeground",
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "error",
  "errorForeground",
]

const CONTRAST_RULES = [
  { text: "foreground", background: "background", minRatio: 4.5, severity: "error" },
  { text: "surfaceForeground", background: "surface", minRatio: 4.5, severity: "error" },
  { text: "primaryForeground", background: "primary", minRatio: 4.5, severity: "error" },
  { text: "secondaryForeground", background: "secondary", minRatio: 4.5, severity: "error" },
  { text: "accentForeground", background: "accent", minRatio: 4.5, severity: "error" },
  { text: "successForeground", background: "success", minRatio: 3, severity: "warning" },
  { text: "warningForeground", background: "warning", minRatio: 3, severity: "warning" },
  { text: "errorForeground", background: "error", minRatio: 3, severity: "warning" },
  { text: "mutedForeground", background: "background", minRatio: 3, severity: "warning" },
]

const THEME_UTILITY_TOKENS = new Set([
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "background",
  "foreground",
  "surface",
  "surface-foreground",
  "border",
  "muted",
  "muted-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "error",
  "error-foreground",
])

/** Raw Tailwind palette families that bypass the theme. `black`/`white` allowed only with opacity (overlays). */
const RAW_PALETTE_RE =
  /\b(?:bg|text|border|from|via|to|fill|stroke|ring|divide|outline|decoration|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?\b/g

const ARBITRARY_COLOR_RE =
  /\b(?:bg|text|border|from|via|to|fill|stroke|ring|shadow)-\[#[0-9A-Fa-f]{3,8}\]/g

const SOLID_BLACK_WHITE_RE = /\b(?:bg|text|border)-(?:black|white)\b(?!\/)/g

const CMS_PRIMITIVE_RE =
  /\b(?:EditableDoc\w+|EditableTextInline|EditableLinkInline|EditableImage\w*|Cms[A-Z]\w*|useSurfaceDocEdit|useHomepageCms|cmsPageKind)\b/

function parseHexColor(hex) {
  const match = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.exec(hex.trim())
  if (!match) return null
  let raw = match[1]
  if (raw.length === 3) raw = raw.split("").map((c) => c + c).join("")
  const n = parseInt(raw, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function contrastRatio(a, b) {
  const lum = (rgb) => {
    const ch = (c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * ch(rgb[0]) + 0.7152 * ch(rgb[1]) + 0.0722 * ch(rgb[2])
  }
  const rgbA = parseHexColor(a)
  const rgbB = parseHexColor(b)
  if (!rgbA || !rgbB) return null
  const l1 = lum(rgbA)
  const l2 = lum(rgbB)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length
}

function stripStatePrefixes(cls) {
  const re = /^(hover|focus|focus-visible|active|group-hover|disabled|aria-[a-z-]+|data-\[[^\]]*\]|md|lg|xl|sm|2xl):/
  let out = cls
  while (re.test(out)) out = out.replace(re, "")
  return out
}

function findClassPairingViolations(className) {
  const violations = []
  let bgToken = null
  let textToken = null
  for (const raw of className.split(/\s+/)) {
    if (!raw) continue
    const cls = stripStatePrefixes(raw)
    const m = /^(bg|text)-([a-z-]+?)(?:\/\d+)?$/.exec(cls)
    if (!m) continue
    if (!THEME_UTILITY_TOKENS.has(m[2])) continue
    if (m[1] === "bg" && !bgToken) bgToken = m[2]
    if (m[1] === "text" && !textToken) textToken = m[2]
  }
  if (bgToken && textToken && bgToken === textToken) {
    violations.push(`bg-${bgToken} + text-${textToken} on one element`)
  }
  if (bgToken === "primary" && textToken && textToken !== "primary-foreground") {
    violations.push(`bg-primary paired with text-${textToken} (use text-primary-foreground)`)
  }
  return violations
}

function extractThemeTokens(source) {
  const tokens = {}
  for (const key of THEME_TOKEN_KEYS) {
    const re = new RegExp(`\\b${key}\\s*:\\s*["'](#[0-9A-Fa-f]{3,6})["']`)
    const m = re.exec(source)
    if (m) tokens[key] = m[1]
  }
  return tokens
}

export function validateTemplateDir(templateDir) {
  const errors = []
  const warnings = []
  const files = walk(templateDir)

  for (const file of files) {
    const rel = path.relative(templateDir, file)
    const source = fs.readFileSync(file, "utf8")
    const isThemeFile = /(?:^|\/)(?:theme|template\.config)\.tsx?$/.test(rel)
    const isRenderish = /\.tsx$/.test(rel)

    if (!isThemeFile) {
      for (const re of [ARBITRARY_COLOR_RE, RAW_PALETTE_RE, SOLID_BLACK_WHITE_RE]) {
        re.lastIndex = 0
        let m
        while ((m = re.exec(source))) {
          errors.push(
            `WSE101 ${rel}:${lineOf(source, m.index)} hardcoded color '${m[0]}' — use theme tokens (bg-surface, text-foreground, …)`
          )
        }
      }
      // raw hex in style props / string literals outside theme files
      const hexRe = /["'`](#[0-9A-Fa-f]{6})["'`]/g
      let hm
      while ((hm = hexRe.exec(source))) {
        errors.push(
          `WSE101 ${rel}:${lineOf(source, hm.index)} raw hex ${hm[1]} — colors belong in defaultTheme tokens`
        )
      }
    }

    if (isRenderish) {
      const classRe = /className\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\})/g
      let cm
      while ((cm = classRe.exec(source))) {
        const className = (cm[1] ?? cm[2] ?? "").replace(/\$\{[^}]*\}/g, " ")
        for (const violation of findClassPairingViolations(className)) {
          errors.push(`WSE102 ${rel}:${lineOf(source, cm.index)} ${violation}`)
        }
      }
    }

    const isPageRender = /pages\/.*Render\.tsx$/.test(rel) || /pages\/[^/]+\/Render\.tsx$/.test(rel)
    if (isPageRender && !CMS_PRIMITIVE_RE.test(source)) {
      warnings.push(
        `WSE103 ${rel} page Render has no CMS primitives (EditableDoc*/Cms*) — visible copy will not be editable`
      )
    }
  }

  // defaultTheme completeness + contrast (theme.ts or template.config.ts)
  const themeFiles = files.filter((f) => /(?:^|\/)(?:theme|template\.config)\.tsx?$/.test(path.relative(templateDir, f)))
  let tokens = {}
  for (const f of themeFiles) {
    tokens = { ...tokens, ...extractThemeTokens(fs.readFileSync(f, "utf8")) }
  }
  if (Object.keys(tokens).length > 0) {
    const missing = THEME_TOKEN_KEYS.filter((k) => !tokens[k])
    if (missing.length > 0) {
      errors.push(`WSE104 defaultTheme is missing tokens: ${missing.join(", ")}`)
    }
    for (const rule of CONTRAST_RULES) {
      const ratio = contrastRatio(tokens[rule.text] ?? "", tokens[rule.background] ?? "")
      if (ratio != null && ratio < rule.minRatio) {
        const msg = `WSE105 defaultTheme: ${rule.text} on ${rule.background} has contrast ${ratio.toFixed(2)} (needs ≥ ${rule.minRatio})`
        if (rule.severity === "error") errors.push(msg)
        else warnings.push(msg)
      }
    }
  } else if (themeFiles.length === 0) {
    warnings.push("WSE104 no theme.ts / template.config.ts with defaultTheme tokens found")
  }

  return { errors, warnings }
}

export async function runValidateTemplate(args) {
  const strict = args.includes("--strict")
  const dirs = args.filter((a) => !a.startsWith("--"))
  if (dirs.length === 0) {
    throw new Error(
      "Usage: wse validate-template <template-dir> [...more] [--strict]\nExample: wse validate-template packages/templates/sakkmed"
    )
  }

  let failed = false
  for (const dir of dirs) {
    const abs = path.resolve(dir)
    if (!fs.existsSync(abs)) throw new Error(`Template dir not found: ${abs}`)
    const { errors, warnings } = validateTemplateDir(abs)
    const name = path.basename(abs)
    for (const w of warnings) console.warn(`  [warn] ${w}`)
    for (const e of errors) console.error(`  [fail] ${e}`)
    const failCount = errors.length + (strict ? warnings.length : 0)
    if (failCount > 0) failed = true
    console.log(
      `${failCount > 0 ? "✗" : "✓"} ${name}: ${errors.length} errors, ${warnings.length} warnings`
    )
  }
  if (failed) process.exit(1)
}
