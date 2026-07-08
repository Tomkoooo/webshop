"use client"

import Link from "next/link"
import {
  formatCmsThemeHintRole,
  formatCmsThemeHintState,
  parseCmsThemeHints,
} from "@wse/core/lib/cms-theme-hints"

type CmsLinkEditPanelProps = {
  title?: string
  label: string
  href: string
  onLabelChange: (value: string) => void
  onHrefChange: (value: string) => void
  onLabelCommit: (value: string) => void
  onHrefCommit: (value: string) => void
  onClose: () => void
  className?: string
  showHref?: boolean
  top: number
  left: number
}

export function CmsLinkEditPanel({
  title = "Button / link",
  label,
  href,
  onLabelChange,
  onHrefChange,
  onLabelCommit,
  onHrefCommit,
  onClose,
  className,
  showHref = true,
  top,
  left,
}: CmsLinkEditPanelProps) {
  const themeHints = parseCmsThemeHints(className)

  return (
    <div
      className="cms-admin-control fixed z-[500] w-80 rounded-md border border-white/15 bg-neutral-900 p-3 shadow-xl space-y-3"
      style={{ top, left }}
    >
      <p className="text-[10px] uppercase tracking-widest text-neutral-400">{title}</p>

      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-widest text-neutral-500">Button text</label>
        <input
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
          onBlur={() => onLabelCommit(label)}
          className="w-full h-8 px-2 bg-neutral-800 border border-white/20 text-xs text-white rounded-none"
          placeholder="Button label"
        />
      </div>

      {showHref ? (
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-widest text-neutral-500">Link URL</label>
          <input
            value={href}
            onChange={(event) => onHrefChange(event.target.value)}
            onBlur={() => onHrefCommit(href)}
            className="w-full h-8 px-2 bg-neutral-800 border border-white/20 text-xs text-white rounded-none"
            placeholder="/contact"
          />
        </div>
      ) : null}

      {themeHints.length > 0 ? (
        <div className="space-y-2 border-t border-white/10 pt-2">
          <p className="text-[9px] uppercase tracking-widest text-neutral-500">Theme colors used</p>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {themeHints.map((hint) => (
              <li
                key={`${hint.state}-${hint.role}-${hint.themeToken}-${hint.className}`}
                className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] leading-snug text-neutral-300"
              >
                <span className="font-mono text-accent">{hint.themeToken}</span>
                <span className="text-neutral-500">
                  {" "}
                  — {formatCmsThemeHintRole(hint.role)} · {formatCmsThemeHintState(hint.state)}
                </span>
                <div className="mt-0.5 font-mono text-[9px] text-neutral-500">{hint.className}</div>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/theme"
            className="inline-block text-[9px] uppercase tracking-widest text-neutral-400 hover:text-white underline underline-offset-2"
          >
            Edit in Theme →
          </Link>
        </div>
      ) : (
        <p className="text-[9px] text-neutral-500 leading-relaxed border-t border-white/10 pt-2">
          No theme tokens detected on this button. Custom classes may need CSS edits; otherwise set colors under{" "}
          <Link href="/admin/theme" className="text-neutral-300 underline underline-offset-2">
            Theme
          </Link>
          .
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full h-8 border border-white/20 text-xs uppercase text-white rounded-none hover:bg-white/5"
      >
        Done
      </button>
    </div>
  )
}
