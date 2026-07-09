"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { THEME_ROLE_GROUPS, validateThemeContrast } from "@wse/sdk/theme/rules"
import {
  DEFAULT_THEME_TYPOGRAPHY,
  THEME_TYPOGRAPHY_KEYS,
  type ThemeTypography,
} from "@wse/sdk/theme/typography"
import { mergeThemeTokens, parseThemeJsonInput } from "@wse/core/lib/parse-theme-json"
import type { ThemeTokens } from "@wse/core/services/theme"

const TYPOGRAPHY_LABELS: Record<keyof ThemeTypography, string> = {
  fontHeading: "Heading font stack",
  fontBody: "Body font stack",
  weightHeading: "Heading weight",
  sizeHero: "Hero size",
  sizeHeading: "Section heading size",
  sizeBody: "Body size",
}

type Props = {
  initial: ThemeTokens
  /** Baseline palette after clearing overrides (template.defaultTheme ?? engine defaults). */
  resetBaseline: ThemeTokens
  resetHelpText?: string
  onSaved?: (theme: ThemeTokens) => void
}

export function ThemeEditor({
  initial,
  resetBaseline,
  resetHelpText,
  onSaved,
}: Props) {
  const router = useRouter()
  const fileInputId = useId()
  const [theme, setTheme] = useState<ThemeTokens>(initial)
  const [typography, setTypography] = useState<Partial<ThemeTypography>>({})
  const [jsonInput, setJsonInput] = useState("")

  const contrastIssues = useMemo(() => validateThemeContrast(theme), [theme])

  useEffect(() => {
    setTheme(initial)
  }, [initial])

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/theme")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.typography === "object") {
          setTypography(data.typography ?? {})
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(
        `--theme-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`,
        value
      )
    })
  }, [theme])

  const applyImportedJson = (text: string, source?: string) => {
    try {
      const { partial, appliedKeys, unknownKeys } = parseThemeJsonInput(text)
      setTheme((prev) => mergeThemeTokens(prev, partial))
      const msg =
        source != null
          ? `${source}: ${appliedKeys.length} color${appliedKeys.length === 1 ? "" : "s"} applied`
          : `Applied ${appliedKeys.length} color${appliedKeys.length === 1 ? "" : "s"}`
      if (unknownKeys.length > 0) {
        toast.success(`${msg} (${unknownKeys.length} unknown key${unknownKeys.length === 1 ? "" : "s"} ignored)`)
      } else {
        toast.success(msg)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid theme JSON")
    }
  }

  const onJsonFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : ""
      setJsonInput(text)
      applyImportedJson(text, file.name)
    }
    reader.onerror = () => toast.error("Could not read file")
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <section className="border border-white/20 bg-black/70 p-4 space-y-3">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-white">Import palette</h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-2xl">
            Upload a <code className="text-neutral-300">.json</code> file or paste palette JSON below, then
            click Apply. Keys: <code className="text-neutral-300">primary</code>,{" "}
            <code className="text-neutral-300">primaryForeground</code>, nested{" "}
            <code className="text-neutral-300">{`{ "colors": { ... } }`}</code> or{" "}
            <code className="text-neutral-300">{`{ "defaultTheme": { ... } }`}</code>. Preview updates
            immediately; use Save theme to persist.
          </p>
        </div>
        <textarea
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault()
              applyImportedJson(jsonInput)
            }
          }}
          rows={8}
          spellCheck={false}
          placeholder={`Paste palette JSON, e.g.\n{\n  "primary": "#2C2416",\n  "primaryForeground": "#FAF6EF"\n}`}
          className="w-full min-h-[140px] font-mono text-sm bg-black border border-white/20 text-white p-3 focus:outline-none focus:border-primary/60"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyImportedJson(jsonInput)}
            className="px-3 h-9 bg-primary text-white text-xs uppercase"
          >
            Apply pasted JSON
          </button>
          <label
            htmlFor={fileInputId}
            className="px-3 h-9 border border-white/20 text-white text-xs uppercase inline-flex items-center cursor-pointer hover:border-primary/50"
          >
            Choose JSON file…
          </label>
          <input
            id={fileInputId}
            type="file"
            accept=".json,application/json,text/plain"
            className="sr-only"
            onChange={(e) => {
              onJsonFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
          <button
            type="button"
            onClick={() => setJsonInput("")}
            className="px-3 h-9 border border-white/20 text-white text-xs uppercase"
          >
            Clear
          </button>
        </div>
      </section>

      <p className="text-xs text-neutral-400 max-w-3xl bg-card shadow-sm p-3">
        <strong className="text-neutral-200">primary</strong> — gombok háttere (
        <code className="text-neutral-300">bg-primary</code>). Boltban ne használd ikonokra, szövegre,
        keretekre — helyette{" "}
        <code className="text-neutral-300">text-primary-foreground</code>,{" "}
        <code className="text-neutral-300">border-primary-foreground/35</code>, vagy{" "}
        <code className="text-neutral-300">text-secondary-foreground</code> (lásd{" "}
        <code className="text-neutral-300">storefront-ui.ts</code>). Admin:{" "}
        <code className="text-neutral-300">admin-value</code>,{" "}
        <code className="text-neutral-300">admin-headline-accent</code>.{" "}
        <strong className="text-neutral-200">primaryForeground</strong> — szöveg primary gombokon és
        storefront kiemelések. <strong className="text-neutral-200">secondaryForeground</strong> — finomabb
        hover/link. <strong className="text-neutral-200">foreground</strong> — fő szöveg és árak.
      </p>

      {contrastIssues.length > 0 ? (
        <section className="border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-amber-900">
            Contrast warnings ({contrastIssues.length})
          </h3>
          <ul className="space-y-1">
            {contrastIssues.map((issue) => (
              <li
                key={`${issue.rule.text}-${issue.rule.background}`}
                className={
                  issue.rule.severity === "error"
                    ? "text-xs text-red-300"
                    : "text-xs text-amber-900/90"
                }
              >
                {issue.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {THEME_ROLE_GROUPS.map((group) => (
        <section key={group.id} className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest text-white border-b border-white/10 pb-1">
            {group.label}
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {group.tokens.map((key) => (
              <label key={key} className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-neutral-400">{key}</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme[key as keyof ThemeTokens]}
                    onChange={(event) =>
                      setTheme((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                  />
                  <input
                    value={theme[key as keyof ThemeTokens]}
                    onChange={(event) =>
                      setTheme((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                    className="flex-1 h-9 px-2 bg-black border border-white/20 text-white text-sm"
                  />
                </div>
              </label>
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-white border-b border-white/10 pb-1">
          Typography
        </h3>
        <p className="text-xs text-neutral-400 max-w-2xl">
          Fonts and heading scale apply as CSS variables next to the colors. Leave a field empty to
          use the template default.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {THEME_TYPOGRAPHY_KEYS.map((key) => (
            <label key={key} className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-neutral-400">
                {TYPOGRAPHY_LABELS[key]}
              </span>
              <input
                value={typography[key] ?? ""}
                placeholder={DEFAULT_THEME_TYPOGRAPHY[key]}
                onChange={(event) =>
                  setTypography((prev) => {
                    const next = { ...prev }
                    if (event.target.value.trim()) next[key] = event.target.value
                    else delete next[key]
                    return next
                  })
                }
                className="w-full h-9 px-2 bg-black border border-white/20 text-white text-sm font-mono"
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(JSON.stringify(theme, null, 2))
              toast.success("Theme JSON copied")
            } catch {
              toast.error("Clipboard not available")
            }
          }}
          className="px-3 h-10 border border-white/20 text-white text-xs uppercase"
        >
          Copy as JSON
        </button>
        <button
          type="button"
          onClick={() => setTheme(resetBaseline)}
          className="px-3 h-10 border border-white/20 text-white text-xs uppercase"
          title={resetHelpText}
        >
          Preview baseline
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch("/api/admin/theme", { method: "DELETE" })
              if (!res.ok) {
                toast.error("Could not reset theme on server")
                return
              }
              const merged = (await res.json()) as ThemeTokens
              setTheme(merged)
              onSaved?.(merged)
              router.refresh()
              toast.success("Saved: theme reset to baseline (overrides cleared)")
            } catch {
              toast.error("Could not reset theme on server")
            }
          }}
          className="px-3 h-10 border border-amber-500/40 text-amber-100 text-xs uppercase"
          title="Writes to disk: storefront uses template or engine baseline until you customise again"
        >
          Reset to default & save
        </button>
        <button
          type="button"
          onClick={async () => {
            const res = await fetch("/api/admin/theme", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ ...theme, typography }),
            })
            if (!res.ok) {
              const err = await res.json().catch(() => ({}))
              toast.error(typeof err?.error === "string" ? err.error : "Theme save failed")
              return
            }
            const updated = (await res.json()) as ThemeTokens
            setTheme(updated)
            onSaved?.(updated)
            router.refresh()
            const issues = validateThemeContrast(updated)
            toast.success("Theme saved")
            if (issues.length > 0) {
              toast.warning(issues.map((issue) => issue.message).join(" "))
            }
          }}
          className="px-3 h-10 bg-primary text-white text-xs uppercase"
        >
          Save theme
        </button>
      </div>

      {resetHelpText ? <p className="text-xs text-neutral-500 max-w-xl">{resetHelpText}</p> : null}
    </div>
  )
}
