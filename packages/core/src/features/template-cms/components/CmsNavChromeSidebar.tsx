"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Megaphone, Plus, Ticket, X } from "lucide-react"
import { Textarea } from "@wse/core/components/ui/textarea"
import { moveArrayItem } from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { CmsStructureSidebar } from "@wse/core/features/template-cms/components/CmsStructureSidebar"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Switch } from "@wse/core/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wse/core/components/ui/select"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
import { defaultNavCta } from "@wse/plugin-t-book/lib/storefront-chrome"
import { getAtPath } from "@wse/core/lib/immutable-set-path"

type NavItemDraft =
  | { type: "link"; label: string; href: string }
  | { type: "dropdown"; label: string; items: Array<{ label: string; href: string }> }

type NavCtaDraft = {
  enabled?: boolean
  label?: string
  mobileLabel?: string
  href?: string
  showIcon?: boolean
}

const iconBtn =
  "rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"

function DropdownItemsEditor({
  items,
  onChange,
}: {
  items: Array<{ label: string; href: string }>
  onChange: (next: Array<{ label: string; href: string }>) => void
}) {
  const setItem = (index: number, key: "label" | "href", value: string) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-2.5">
      <p className="text-xs font-medium text-muted-foreground">Almenüpontok</p>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-1">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Input
              value={item.label}
              placeholder="Felirat"
              className="h-8 text-xs"
              onChange={(e) => setItem(index, "label", e.target.value)}
            />
            <Input
              value={item.href}
              placeholder="/oldal vagy https://…"
              className="h-8 text-xs"
              onChange={(e) => setItem(index, "href", e.target.value)}
            />
          </div>
          <button
            type="button"
            title="Törlés"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="mt-1 rounded-md p-1 text-destructive/80 transition-colors hover:bg-destructive/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { label: "", href: "" }])}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border/60 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        Almenüpont
      </button>
    </div>
  )
}

/**
 * Structured sidebar for festival nav chrome: menu items + configurable Jegyek CTA button.
 */
export function CmsNavChromeSidebar({
  draft,
  setPath,
  readOnly = false,
  showTicker = false,
}: {
  draft: Record<string, unknown>
  setPath: (path: string, value: unknown) => void
  /** When true, nav is preview-only (e.g. tBook page editors). */
  readOnly?: boolean
  /** World Darts Festival looping announcement under the navbar. */
  showTicker?: boolean
}) {
  const rawNav = getAtPath(draft, "chrome.nav")
  const navItems = Array.isArray(rawNav) ? (rawNav as NavItemDraft[]) : []
  const rawCta = getAtPath(draft, "chrome.navCta")
  const navCta = (typeof rawCta === "object" && rawCta !== null ? rawCta : {}) as NavCtaDraft
  const ctaEnabled = navCta.enabled ?? defaultNavCta.enabled

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const setNavItems = (next: NavItemDraft[]) => setPath("chrome.nav", next)

  const setNavItemField = (index: number, key: string, value: unknown) => {
    setNavItems(navItems.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  const setCtaField = (key: keyof NavCtaDraft, value: unknown) => {
    setPath("chrome.navCta", { ...defaultNavCta, ...navCta, [key]: value })
  }

  const rawTicker = getAtPath(draft, "chrome.tickerText")
  const tickerText = typeof rawTicker === "string" ? rawTicker : ""

  const defaultNewLink = (): NavItemDraft => ({ type: "link", label: "", href: "" })
  const defaultNewDropdown = (): NavItemDraft => ({
    type: "dropdown",
    label: "",
    items: [{ label: "", href: "" }],
  })

  return (
    <CmsStructureSidebar title="Navigáció">
      {showTicker && !readOnly ? (
        <section className="space-y-3 rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Megaphone className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Futószöveg</p>
              <p className="text-xs text-muted-foreground">
                Fekete sáv a menü alatt — a szöveg a CMS előnézeten is animálódik
              </p>
            </div>
          </div>
          <Textarea
            className="min-h-[72px] text-xs"
            value={tickerText}
            placeholder="World Darts Festival 2025 — Budapest  ·  Entries now open"
            onChange={(e) => setPath("chrome.tickerText", e.target.value)}
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Hagyd üresen, ha el szeretnéd rejteni. A sáv a közzététel után minden oldalon megjelenik.
          </p>
        </section>
      ) : null}

      {!readOnly ? (
        <section className="space-y-3 rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Ticket className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Jegyek gomb</p>
              <p className="text-xs text-muted-foreground">Arany CTA a menüsor jobb oldalán</p>
            </div>
            <Switch
              checked={ctaEnabled}
              onCheckedChange={(checked) => setCtaField("enabled", checked)}
              aria-label="Jegyek gomb megjelenítése"
            />
          </div>

          {ctaEnabled ? (
            <div className="space-y-2.5 border-t border-border/40 pt-3">
              <div className="space-y-1.5">
                <Label className={adminFieldLabel}>Asztali felirat</Label>
                <Input
                  className="h-8 text-xs"
                  value={navCta.label ?? defaultNavCta.label}
                  onChange={(e) => setCtaField("label", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={adminFieldLabel}>Mobil felirat</Label>
                <Input
                  className="h-8 text-xs"
                  value={navCta.mobileLabel ?? defaultNavCta.mobileLabel}
                  onChange={(e) => setCtaField("mobileLabel", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={adminFieldLabel}>Link (URL)</Label>
                <Input
                  className="h-8 text-xs"
                  value={navCta.href ?? defaultNavCta.href}
                  placeholder="/jegyek"
                  onChange={(e) => setCtaField("href", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className={adminFieldLabel}>Jegy ikon</Label>
                <Switch
                  checked={navCta.showIcon ?? defaultNavCta.showIcon}
                  onCheckedChange={(checked) => setCtaField("showIcon", checked)}
                  aria-label="Jegy ikon megjelenítése"
                />
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="rounded-lg bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          A menü és a Jegyek gomb a{" "}
          <strong className="font-medium text-foreground">Főoldal</strong> CMS-ből jön. Szerkeszd ott,
          majd közzététel után frissül az előnézet.
        </p>
      )}

      {!readOnly ? (
        <section className="cms-admin-control space-y-2">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Menüpontok</h3>
            <span className="text-xs text-muted-foreground">{navItems.length} elem</span>
          </header>

          <div className="space-y-1.5">
            {navItems.map((item, index) => {
              const open = openIndex === index
              const title = item.label.trim() || `Elem ${index + 1}`
              return (
                <div key={index} className="rounded-lg bg-muted/40 shadow-sm">
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? null : index)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    >
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-xs text-foreground">{title}</span>
                      <span className="shrink-0 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {item.type === "dropdown" ? "lenyíló" : "link"}
                      </span>
                    </button>
                    <button
                      type="button"
                      title="Fel"
                      disabled={index === 0}
                      onClick={() => setNavItems(moveArrayItem(navItems, index, -1))}
                      className={iconBtn}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Le"
                      disabled={index === navItems.length - 1}
                      onClick={() => setNavItems(moveArrayItem(navItems, index, 1))}
                      className={iconBtn}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Duplikálás"
                      disabled={navItems.length >= 12}
                      onClick={() => {
                        const next = [...navItems]
                        next.splice(index + 1, 0, structuredClone(item))
                        setNavItems(next)
                      }}
                      className={iconBtn}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Törlés"
                      onClick={() => {
                        setNavItems(navItems.filter((_, i) => i !== index))
                        setOpenIndex(null)
                      }}
                      className="rounded-md p-1 text-destructive/80 transition-colors hover:bg-destructive/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {open ? (
                    <div className="space-y-3 border-t border-border/40 px-2.5 py-2.5">
                      <div className="space-y-1.5">
                        <Label className={adminFieldLabel}>Típus</Label>
                        <Select
                          value={item.type}
                          onValueChange={(value: "link" | "dropdown") => {
                            setNavItems(
                              navItems.map((nav, i) => {
                                if (i !== index) return nav
                                if (value === "link") {
                                  return {
                                    type: "link",
                                    label: nav.label,
                                    href: nav.type === "link" ? nav.href : "/",
                                  }
                                }
                                return {
                                  type: "dropdown",
                                  label: nav.label,
                                  items:
                                    nav.type === "dropdown" && nav.items.length > 0
                                      ? nav.items
                                      : [{ label: "", href: "" }],
                                }
                              })
                            )
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">Link</SelectItem>
                            <SelectItem value="dropdown">Lenyíló menü</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className={adminFieldLabel}>Felirat</Label>
                        <Input
                          className="h-8 text-xs"
                          value={item.label}
                          onChange={(e) => setNavItemField(index, "label", e.target.value)}
                        />
                      </div>
                      {item.type === "link" ? (
                        <div className="space-y-1.5">
                          <Label className={adminFieldLabel}>URL</Label>
                          <Input
                            className="h-8 text-xs"
                            value={item.href}
                            placeholder="/oldal vagy /#szekció"
                            onChange={(e) => setNavItemField(index, "href", e.target.value)}
                          />
                        </div>
                      ) : (
                        <DropdownItemsEditor
                          items={item.items}
                          onChange={(next) => setNavItemField(index, "items", next)}
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {navItems.length < 12 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setNavItems([...navItems, defaultNewLink()])
                  setOpenIndex(navItems.length)
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setNavItems([...navItems, defaultNewDropdown()])
                  setOpenIndex(navItems.length)
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Lenyíló
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </CmsStructureSidebar>
  )
}
