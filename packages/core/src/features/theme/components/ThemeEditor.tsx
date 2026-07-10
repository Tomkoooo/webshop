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
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Textarea } from "@wse/core/components/ui/textarea"
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
      <Card>
        <CardHeader>
          <CardTitle>Paletta importálása</CardTitle>
          <CardDescription>
            JSON fájl vagy beillesztett paletta — az előnézet azonnal frissül; a mentéshez használd a „Téma mentése” gombot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
        <Textarea
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
          placeholder={`{\n  "primary": "#2C2416",\n  "primaryForeground": "#FAF6EF"\n}`}
          className="min-h-[140px] font-mono text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={() => applyImportedJson(jsonInput)}>
            Beillesztett JSON alkalmazása
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <label htmlFor={fileInputId} className="cursor-pointer">
              JSON fájl kiválasztása…
            </label>
          </Button>
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
          <Button type="button" size="sm" variant="outline" onClick={() => setJsonInput("")}>
            Törlés
          </Button>
        </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground max-w-3xl rounded-lg bg-muted/40 p-3">
        <strong className="text-foreground">primary</strong> — gombok háttere (
        <code>bg-primary</code>). Boltban ne használd ikonokra, szövegre,
        keretekre — helyette <code>text-primary-foreground</code>,{" "}
        <code>border-primary-foreground/35</code>, vagy <code>text-secondary-foreground</code>.{" "}
        <strong className="text-foreground">primaryForeground</strong> — szöveg primary gombokon.
        <strong className="text-foreground"> foreground</strong> — fő szöveg és árak.
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
        <Card key={group.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {group.tokens.map((key) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">{key}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme[key as keyof ThemeTokens]}
                    onChange={(event) =>
                      setTheme((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                    className="size-9 shrink-0 cursor-pointer rounded-md border-0 bg-transparent"
                  />
                  <Input
                    value={theme[key as keyof ThemeTokens]}
                    onChange={(event) =>
                      setTheme((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipográfia</CardTitle>
          <CardDescription>
            Betűtípusok és méretek CSS változóként — üres mező = sablon alapértelmezés.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {THEME_TYPOGRAPHY_KEYS.map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {TYPOGRAPHY_LABELS[key]}
              </Label>
              <Input
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
                className="font-mono text-sm"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(JSON.stringify(theme, null, 2))
              toast.success("Theme JSON copied")
            } catch {
              toast.error("Clipboard not available")
            }
          }}
        >
          Másolás JSON-ként
        </Button>
        <Button type="button" variant="outline" onClick={() => setTheme(resetBaseline)} title={resetHelpText}>
          Előnézet alapállapot
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-amber-700 hover:text-amber-800"
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
          title="Writes to disk: storefront uses template or engine baseline until you customise again"
        >
          Visszaállítás és mentés
        </Button>
        <Button
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
        >
          Téma mentése
        </Button>
      </div>

      {resetHelpText ? <p className="text-xs text-muted-foreground max-w-xl">{resetHelpText}</p> : null}
    </div>
  )
}
