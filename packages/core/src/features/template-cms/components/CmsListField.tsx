"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Plus, X } from "lucide-react"
import { moveArrayItem } from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"
import { UploadSheet } from "@wse/core/features/site-settings/components/UploadSheet"
import { cn } from "@wse/core/lib/utils"
import type { CmsListItemFieldSpec } from "@wse/sdk/templates/types"

export type CmsListItemField = CmsListItemFieldSpec

type Item = Record<string, unknown>

type CmsListFieldProps = {
  /** Array path in the page document (matches the on-canvas `CmsList` path). */
  path: string
  label: string
  items: Item[]
  fields: CmsListItemField[]
  onChange: (next: Item[]) => void
  /** Item key used as the card title (defaults to the first field). */
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

/**
 * Structured list manager for the CMS sidebar: card list with reorder,
 * duplicate, delete, and a compact per-item form. Writes through the same
 * document path as the on-canvas `CmsList`, so both stay in sync.
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
        <h3 className="text-xs font-black uppercase tracking-widest text-white">{label}</h3>
        <span className="text-[10px] text-neutral-500">{items.length} elem</span>
      </header>

      <div className="space-y-1.5">
        {items.map((item, index) => {
          const open = openIndex === index
          const title = String(item[headerKey ?? ""] ?? "") || `Elem ${index + 1}`
          return (
            <div key={index} className="rounded-lg border border-white/10 bg-white/5">
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
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  )}
                  <span className="truncate text-xs text-neutral-200">{title}</span>
                </button>
                <button
                  type="button"
                  title="Fel"
                  disabled={index === 0}
                  onClick={() => onChange(moveArrayItem(items, index, -1))}
                  className="rounded p-1 text-neutral-400 hover:bg-white/10 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Le"
                  disabled={index === items.length - 1}
                  onClick={() => onChange(moveArrayItem(items, index, 1))}
                  className="rounded p-1 text-neutral-400 hover:bg-white/10 disabled:opacity-30"
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
                  className="rounded p-1 text-neutral-400 hover:bg-white/10 disabled:opacity-30"
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
                  className="rounded p-1 text-red-400/80 hover:bg-red-500/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {open ? (
                <div className="space-y-2 border-t border-white/10 px-2.5 py-2.5">
                  {fields.map((field) => {
                    const value = item[field.key]
                    if (field.type === "link") {
                      const link = (value ?? {}) as { label?: string; href?: string }
                      return (
                        <div key={field.key} className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                            {field.label}
                          </span>
                          <input
                            value={link.label ?? ""}
                            placeholder="Felirat"
                            onChange={(e) =>
                              setItemField(index, field.key, { ...link, label: e.target.value })
                            }
                            className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                          />
                          <input
                            value={link.href ?? ""}
                            placeholder="https://… vagy /oldal"
                            onChange={(e) =>
                              setItemField(index, field.key, { ...link, href: e.target.value })
                            }
                            className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                          />
                        </div>
                      )
                    }
                    if (field.type === "image") {
                      return (
                        <div key={field.key} className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                            {field.label}
                          </span>
                          <input
                            value={String(value ?? "")}
                            placeholder={field.placeholder ?? "/api/media/…"}
                            onChange={(e) => setItemField(index, field.key, e.target.value)}
                            className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
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
                        <label key={field.key} className="block space-y-1">
                          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                            {field.label}
                          </span>
                          <textarea
                            value={String(value ?? "")}
                            placeholder={field.placeholder}
                            rows={3}
                            onChange={(e) => setItemField(index, field.key, e.target.value)}
                            className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                          />
                        </label>
                      )
                    }
                    return (
                      <label key={field.key} className="block space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                          {field.label}
                        </span>
                        <input
                          value={String(value ?? "")}
                          placeholder={field.placeholder}
                          onChange={(e) => setItemField(index, field.key, e.target.value)}
                          className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                        />
                      </label>
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
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2 text-xs text-neutral-300 hover:border-white/40 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Új elem
        </button>
      ) : null}
    </section>
  )
}
