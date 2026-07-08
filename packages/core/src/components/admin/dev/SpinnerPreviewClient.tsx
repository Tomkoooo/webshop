"use client"

import { useEffect, useState } from "react"
import { LoadingSpinner, type LoadingSpinnerSize } from "@wse/core/components/ui/LoadingSpinner"
import { sfSpinner } from "@wse/core/lib/storefront-ui"

const SIZES: LoadingSpinnerSize[] = ["xs", "sm", "md", "lg", "xl"]

const THEME_VARS = [
  "--theme-primary",
  "--theme-primary-foreground",
  "--theme-secondary",
  "--theme-secondary-foreground",
  "--theme-muted",
  "--theme-foreground",
  "--theme-background",
] as const

function readThemeVars(): Record<string, string> {
  const style = getComputedStyle(document.documentElement)
  const out: Record<string, string> = {}
  for (const name of THEME_VARS) {
    out[name] = style.getPropertyValue(name).trim() || "(empty)"
  }
  return out
}

function Swatch({ name, value }: { name: string; value: string }) {
  const isColor = value.startsWith("#") || value.startsWith("rgb") || value.startsWith("oklch")
  return (
    <div className="flex items-center gap-3 rounded border border-white/10 bg-white/5 px-3 py-2">
      {isColor ? (
        <span
          className="h-8 w-8 shrink-0 rounded border border-white/20"
          style={{ backgroundColor: value }}
          aria-hidden
        />
      ) : (
        <span className="h-8 w-8 shrink-0 rounded border border-white/20 bg-black/40" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{name}</p>
        <p className="truncate font-mono text-xs text-white">{value}</p>
      </div>
    </div>
  )
}

export function SpinnerPreviewClient() {
  const [themeVars, setThemeVars] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    setThemeVars(readThemeVars())
  }, [])

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-lg font-black uppercase tracking-wider text-white">Theme tokens</h2>
        <p className="text-sm text-neutral-400 max-w-2xl">
          All spinners use <code className="text-primary-foreground/80">LoadingSpinner</code> →{" "}
          <code className="text-primary-foreground/80">sfSpinner</code> (
          <code className="text-primary-foreground/80">border-primary-foreground</code> ring).
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {themeVars
            ? Object.entries(themeVars).map(([name, value]) => (
                <Swatch key={name} name={name} value={value} />
              ))
            : THEME_VARS.map((name) => (
                <div
                  key={name}
                  className="h-[52px] animate-pulse rounded border border-white/10 bg-white/5"
                />
              ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-black uppercase tracking-wider text-white">Sizes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIZES.map((size) => (
            <div
              key={size}
              className="flex flex-col gap-4 border border-white/10 bg-white/3 p-5"
            >
              <p className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                size=&quot;{size}&quot;
              </p>
              <div className="flex min-h-[100px] items-center justify-center rounded border border-primary-foreground/20 bg-background">
                <LoadingSpinner size={size} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-black uppercase tracking-wider text-white">sfSpinner classes</h2>
        <pre className="overflow-x-auto rounded bg-black/50 p-3 font-mono text-[10px] text-emerald-300/90">
          {`animate-spin rounded-full border-solid ${sfSpinner}`}
        </pre>
      </section>
    </div>
  )
}
