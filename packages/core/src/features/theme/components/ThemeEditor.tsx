"use client"

import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { THEME_TOKEN_KEYS } from "@wse/sdk/theme/theme-token-keys"
import { mergeThemeTokens, parseThemeJsonInput } from "@wse/core/lib/parse-theme-json"
import { getThemeContrastWarnings } from "@wse/core/lib/theme-sanitize"
import type { ThemeTokens } from "@wse/core/services/theme"

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
  const [jsonInput, setJsonInput] = useState("")

  useEffect(() => {
    setTheme(initial)
  }, [initial])

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
          <p className="mt-1 text-[11px] text-neutral-400 max-w-2xl">
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

      <p className="text-[11px] text-neutral-400 max-w-3xl border border-white/10 bg-white/5 p-3">
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

      <div className="grid md:grid-cols-2 gap-3">
        {THEME_TOKEN_KEYS.map((key) => (
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
              body: JSON.stringify(theme),
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
            const warnings = getThemeContrastWarnings(updated)
            if (warnings.length > 0) {
              toast.success("Theme saved")
              toast.warning(warnings.join(" "))
            } else {
              toast.success("Theme saved")
            }
          }}
          className="px-3 h-10 bg-primary text-white text-xs uppercase"
        >
          Save theme
        </button>
      </div>

      {resetHelpText ? <p className="text-[11px] text-neutral-500 max-w-xl">{resetHelpText}</p> : null}
    </div>
  )
}
