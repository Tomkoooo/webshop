"use client"

import Link from "next/link"
import {
  formatCmsThemeHintRole,
  formatCmsThemeHintState,
  parseCmsThemeHints,
} from "@wse/core/lib/cms-theme-hints"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"

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
  title = "Gomb / link",
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
      className="cms-admin-control fixed z-[500] w-80 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xl space-y-3"
      style={{ top, left }}
      role="dialog"
      aria-label={title}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>

      <div className="space-y-1.5">
        <Label className={adminFieldLabel}>Felirat</Label>
        <Input
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
          onBlur={() => onLabelCommit(label)}
          placeholder="Gomb felirat"
          className="h-9 bg-background"
        />
      </div>

      {showHref ? (
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Link URL</Label>
          <Input
            value={href}
            onChange={(event) => onHrefChange(event.target.value)}
            onBlur={() => onHrefCommit(href)}
            placeholder="/contact"
            className="h-9 bg-background"
          />
        </div>
      ) : null}

      {themeHints.length > 0 ? (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-xs font-medium text-muted-foreground">Használt téma színek</p>
          <ul className="max-h-32 space-y-1.5 overflow-y-auto text-xs text-muted-foreground">
            {themeHints.map((hint) => (
              <li key={`${hint.state}-${hint.role}-${hint.themeToken}-${hint.className}`} className="rounded-md bg-muted/50 px-2 py-1.5">
                <span className="font-mono text-primary">{hint.themeToken}</span>
                <span>
                  {" "}
                  — {formatCmsThemeHintRole(hint.role)} · {formatCmsThemeHintState(hint.state)}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/admin/cms/settings?section=theme" className="text-xs font-medium text-primary hover:underline">
            Téma szerkesztése →
          </Link>
        </div>
      ) : (
        <p className="border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
          Egyedi osztályok esetén a színeket a{" "}
          <Link href="/admin/cms/settings?section=theme" className="text-primary hover:underline">
            Téma
          </Link>{" "}
          menüben állíthatod.
        </p>
      )}

      <Button type="button" size="sm" className="w-full" onClick={onClose}>
        Kész
      </Button>
    </div>
  )
}
