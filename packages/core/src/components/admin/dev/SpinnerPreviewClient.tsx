"use client"

import { useEffect, useState } from "react"
import { LoadingSpinner, type LoadingSpinnerSize } from "@wse/core/components/ui/LoadingSpinner"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import { adminSectionTitle } from "@wse/core/lib/admin-ui"
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
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 shadow-sm">
      {isColor ? (
        <span
          className="h-8 w-8 shrink-0 rounded border border-border/50"
          style={{ backgroundColor: value }}
          aria-hidden
        />
      ) : (
        <span className="h-8 w-8 shrink-0 rounded bg-background shadow-sm" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="font-mono text-xs text-muted-foreground">{name}</p>
        <p className="truncate font-mono text-xs text-foreground">{value}</p>
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
      <AdminPanel title="Theme tokens">
        <p className="text-sm text-muted-foreground max-w-2xl">
          All spinners use <code className="text-foreground">LoadingSpinner</code> →{" "}
          <code className="text-foreground">sfSpinner</code> (
          <code className="text-foreground">border-primary-foreground</code> ring).
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {themeVars
            ? Object.entries(themeVars).map(([name, value]) => (
                <Swatch key={name} name={name} value={value} />
              ))
            : THEME_VARS.map((name) => (
                <div
                  key={name}
                  className="h-[52px] animate-pulse rounded-lg bg-muted/50"
                />
              ))}
        </div>
      </AdminPanel>

      <section className="space-y-4">
        <h2 className={adminSectionTitle}>Sizes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIZES.map((size) => (
            <Card key={size}>
              <CardContent className="flex flex-col gap-4 p-5">
                <p className="font-mono text-xs text-muted-foreground">size=&quot;{size}&quot;</p>
                <div className="flex min-h-[100px] items-center justify-center rounded-lg bg-muted/30">
                  <LoadingSpinner size={size} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className={adminSectionTitle}>sfSpinner classes</h2>
        <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-xs text-emerald-800">
          {`animate-spin rounded-full border-solid ${sfSpinner}`}
        </pre>
      </section>
    </div>
  )
}
