"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Plus, X } from "lucide-react"
import { moveArrayItem } from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Textarea } from "@wse/core/components/ui/textarea"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
import type { CmsListItemFieldSpec } from "@wse/sdk/templates/types"

export type CmsListItemField = CmsListItemFieldSpec

type Item = Record<string, unknown>

type CmsListFieldProps = {
  path: string
  label: string
  items: Item[]
  fields: CmsListItemField[]
  onChange: (next: Item[]) => void
  titleKey?: string
  createItem?: () => Item
  maxItems?: number
  className?: string
}

function scrollCanvasItemIntoView(path: string, index: number) {
  const el = document.querySelector(`[data-cms-list-item="${path}.${index}"]`)
  if (!(el instanceof HTMLElement)) return
  el.scrollIntoView({ behavior: "smooth", block: "center" })
  el.style.outline = "2px solid rgba(59,130,246,0.9)"
  el.style.outlineOffset = "4px"
  window.setTimeout(() => {
    el.style.outline = ""
    el.style.outlineOffset = ""
  }, 1600)
}

const iconBtn =
  "rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"

/**
 * Structured list manager for the CMS sidebar: card list with reorder,
 * duplicate, delete, and a compact per-item form.
 */
export function CmsListField({
  path,
  label,
  items,
  fields,
  onChange,
  titleKey,
  createItem,
  maxItems,
  className,
}: CmsListFieldProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const headerKey = titleKey ?? fields[0]?.key

  const setItemField = (index: number, key: string, value: unknown) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    onChange(next)
  }

  const defaultNewItem = (): Item =>
    Object.fromEntries(fields.map((field) => [field.key, field.type === "link" ? { label: "", href: "" } : ""]))

  return (
    <section className={cn("cms-admin-control space-y-2", className)}>
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-muted-foreground text-xs">{items.length} elem</span>
      </header>

      <div className="space-y-1.5">
        {items.map((item, index) => {
          const open = openIndex === index
          const title = String(item[headerKey ?? ""] ?? "") || `Elem ${index + 1}`
          return (
            <div key={index} className="rounded-lg bg-muted/40 shadow-sm">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpenIndex(open ? null : index)
                    if (!open) scrollCanvasItemIntoView(path, index)
                  }}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                >
                  {open ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-xs text-foreground">{title}</span>
                </button>
                <button
                  type="button"
                  title="Fel"
                  disabled={index === 0}
                  onClick={() => onChange(moveArrayItem(items, index, -1))}
                  className={iconBtn}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Le"
                  disabled={index === items.length - 1}
                  onClick={() => onChange(moveArrayItem(items, index, 1))}
                  className={iconBtn}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Duplikálás"
                  disabled={maxItems != null && items.length >= maxItems}
                  onClick={() => {
                    const next = [...items]
                    next.splice(index + 1, 0, structuredClone(item))
                    onChange(next)
                  }}
                  className={iconBtn}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Törlés"
                  onClick={() => {
                    onChange(items.filter((_, i) => i !== index))
                    setOpenIndex(null)
                  }}
                  className="rounded-md p-1 text-destructive/80 transition-colors hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {open ? (
                <div className="space-y-3 border-t border-border/40 px-2.5 py-2.5">
                  {fields.map((field) => {
                    const value = item[field.key]
                    if (field.type === "link") {
                      const link = (value ?? {}) as { label?: string; href?: string }
                      return (
                        <div key={field.key} className="space-y-2">
                          <Label className={adminFieldLabel}>{field.label}</Label>
                          <Input
                            value={link.label ?? ""}
                            placeholder="Felirat"
                            className="h-8 text-xs"
                            onChange={(e) =>
                              setItemField(index, field.key, { ...link, label: e.target.value })
                            }
                          />
                          <Input
                            value={link.href ?? ""}
                            placeholder="https://… vagy /oldal"
                            className="h-8 text-xs"
                            onChange={(e) =>
                              setItemField(index, field.key, { ...link, href: e.target.value })
                            }
                          />
                        </div>
                      )
                    }
                    if (field.type === "image") {
                      return (
                        <div key={field.key} className="space-y-2">
                          <Label className={adminFieldLabel}>{field.label}</Label>
                          <Input
                            value={String(value ?? "")}
                            placeholder={field.placeholder ?? "/api/media/…"}
                            className="h-8 text-xs"
                            onChange={(e) => setItemField(index, field.key, e.target.value)}
                          />
                          <UploadSheet
                            onUploaded={(next) => setItemField(index, field.key, next)}
                            label="Kép feltöltése"
                          />
                        </div>
                      )
                    }
                    if (field.type === "multiline") {
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <Label className={adminFieldLabel}>{field.label}</Label>
                          <Textarea
                            value={String(value ?? "")}
                            placeholder={field.placeholder}
                            rows={3}
                            className="text-xs"
                            onChange={(e) => setItemField(index, field.key, e.target.value)}
                          />
                        </div>
                      )
                    }
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <Label className={adminFieldLabel}>{field.label}</Label>
                        <Input
                          value={String(value ?? "")}
                          placeholder={field.placeholder}
                          className="h-8 text-xs"
                          onChange={(e) => setItemField(index, field.key, e.target.value)}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {maxItems == null || items.length < maxItems ? (
        <button
          type="button"
          onClick={() => {
            const factory = createItem ?? defaultNewItem
            onChange([...items, factory()])
            setOpenIndex(items.length)
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Új elem
        </button>
      ) : null}
    </section>
  )
}
