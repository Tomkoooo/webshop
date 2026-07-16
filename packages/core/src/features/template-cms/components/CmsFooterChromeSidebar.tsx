"use client"

import { Plus, Trash2 } from "lucide-react"
import { CmsStructureSidebar } from "@wse/core/features/template-cms/components/CmsStructureSidebar"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Button } from "@wse/core/components/ui/button"
import { Checkbox } from "@wse/core/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wse/core/components/ui/select"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import type { FooterContactEntry, FooterSettings } from "@wse/core/services/footer-settings"

const socialLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  youtube: "YouTube",
}

const defaultContactEntry = (): FooterContactEntry => ({
  label: "",
  value: "",
  kind: "text",
})

/**
 * Single source of truth for footer editing in the visual CMS.
 * Covers tagline, section titles, contact rows, quick links, social, and copyright.
 */
export function CmsFooterChromeSidebar({
  settings,
  onChange,
}: {
  settings: FooterSettings
  onChange: (next: FooterSettings) => void | Promise<void>
}) {
  const patch = (partial: Partial<FooterSettings>) => {
    void onChange({ ...settings, ...partial })
  }

  const contactEntries = settings.contactEntries ?? []
  const quickLinks = settings.quickLinks ?? []

  return (
    <CmsStructureSidebar title="Lábléc">
      <section className="space-y-3">
        <p className="text-xs text-muted-foreground">
          A logó a „Böngésző fejléc és lábléc” sávban szerkeszthető.
        </p>
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Szöveg a logó alatt</Label>
          <Input
            className="h-8 text-xs"
            value={settings.tagline}
            placeholder="Rövid szlogen"
            onChange={(e) => patch({ tagline: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-border/40 pt-4">
        <p className="text-sm font-semibold text-foreground">Oszlop címek</p>
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Kapcsolat cím</Label>
          <Input
            className="h-8 text-xs"
            value={settings.contactTitle}
            onChange={(e) => patch({ contactTitle: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Gyors linkek cím</Label>
          <Input
            className="h-8 text-xs"
            value={settings.quickLinksTitle}
            onChange={(e) => patch({ quickLinksTitle: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-border/40 pt-4">
        <header className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Kapcsolati sorok</p>
          <span className="text-xs text-muted-foreground">{contactEntries.length} elem</span>
        </header>
        <p className="text-xs text-muted-foreground">
          Kulcs–érték párok a lábléc Kapcsolat oszlopában (pl. E-mail, Telefon, Adószám).
          Típus: szöveg, link, e-mail vagy telefon.
        </p>
        <div className="space-y-2">
          {contactEntries.map((entry, index) => (
            <div key={index} className="space-y-1.5 rounded-lg bg-muted/40 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <Label className={adminFieldLabel}>Típus</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive"
                  onClick={() =>
                    patch({
                      contactEntries: contactEntries.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <Select
                value={entry.kind}
                onValueChange={(kind: FooterContactEntry["kind"]) =>
                  patch({
                    contactEntries: contactEntries.map((row, i) =>
                      i === index ? { ...row, kind } : row
                    ),
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Szöveg</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="mailto">E-mail</SelectItem>
                  <SelectItem value="tel">Telefon</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="h-8 text-xs"
                value={entry.label}
                placeholder="Felirat (pl. E-mail)"
                onChange={(e) =>
                  patch({
                    contactEntries: contactEntries.map((row, i) =>
                      i === index ? { ...row, label: e.target.value } : row
                    ),
                  })
                }
              />
              <Input
                className="h-8 text-xs"
                value={entry.value}
                placeholder={
                  entry.kind === "mailto"
                    ? "info@example.com"
                    : entry.kind === "tel"
                      ? "+36 1 234 5678"
                      : entry.kind === "link"
                        ? "https://…"
                        : "Érték"
                }
                onChange={(e) =>
                  patch({
                    contactEntries: contactEntries.map((row, i) =>
                      i === index ? { ...row, value: e.target.value } : row
                    ),
                  })
                }
              />
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => patch({ contactEntries: [...contactEntries, defaultContactEntry()] })}
        >
          <Plus className="size-3.5" />
          Kapcsolati sor
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() =>
            patch({
              contactEntries: [
                ...contactEntries,
                { label: "Adószám", value: "", kind: "text" },
              ],
            })
          }
        >
          + Adószám sor
        </Button>
      </section>

      <section className="space-y-3 border-t border-border/40 pt-4">
        <p className="text-sm font-semibold text-foreground">Szervező blokk</p>
        <p className="text-xs text-muted-foreground">
          Cégadatok a láblécben (név, adószám, címek).
        </p>
        {(
          [
            ["title", "Blokk cím"],
            ["companyName", "Cégnév"],
            ["taxNumber", "Adószám"],
            ["registeredAddress", "Székhely"],
            ["mailingAddress", "Levelezési cím"],
            ["openingHours", "Nyitvatartás"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label className={adminFieldLabel}>{label}</Label>
            <Input
              className="h-8 text-xs"
              value={settings.organizerSection?.[key] ?? ""}
              onChange={(e) =>
                patch({
                  organizerSection: {
                    title: settings.organizerSection?.title ?? "",
                    companyName: settings.organizerSection?.companyName ?? "",
                    registeredAddress: settings.organizerSection?.registeredAddress ?? "",
                    mailingAddress: settings.organizerSection?.mailingAddress ?? "",
                    openingHours: settings.organizerSection?.openingHours ?? "",
                    taxNumber: settings.organizerSection?.taxNumber ?? "",
                    [key]: e.target.value,
                  },
                })
              }
            />
          </div>
        ))}
      </section>

      <section className="space-y-3 border-t border-border/40 pt-4">
        <header className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Gyors linkek</p>
          <span className="text-xs text-muted-foreground">{quickLinks.length} elem</span>
        </header>
        <div className="space-y-2">
          {quickLinks.map((item, index) => (
            <div key={index} className="flex items-start gap-1">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input
                  className="h-8 text-xs"
                  value={item.label}
                  placeholder="Felirat"
                  onChange={(e) =>
                    patch({
                      quickLinks: quickLinks.map((row, i) =>
                        i === index ? { ...row, label: e.target.value } : row
                      ),
                    })
                  }
                />
                <Input
                  className="h-8 text-xs"
                  value={item.href}
                  placeholder="/oldal vagy /#szekció"
                  onChange={(e) =>
                    patch({
                      quickLinks: quickLinks.map((row, i) =>
                        i === index ? { ...row, href: e.target.value } : row
                      ),
                    })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-destructive"
                onClick={() =>
                  patch({ quickLinks: quickLinks.filter((_, i) => i !== index) })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() =>
            patch({ quickLinks: [...quickLinks, { label: "Új link", href: "/" }] })
          }
        >
          <Plus className="size-3.5" />
          Link hozzáadása
        </Button>
      </section>

      <section className="space-y-3 border-t border-border/40 pt-4">
        <p className="text-sm font-semibold text-foreground">Közösségi média</p>
        {settings.socialLinks.map((item, index) => (
          <div key={item.platform} className="space-y-1.5 rounded-lg bg-muted/40 p-2.5">
            <Label className={adminFieldLabel}>
              {socialLabels[item.platform] || item.platform}
            </Label>
            <Input
              className="h-8 text-xs"
              value={item.url}
              placeholder="https://…"
              onChange={(e) =>
                patch({
                  socialLinks: settings.socialLinks.map((row, i) =>
                    i === index ? { ...row, url: e.target.value } : row
                  ),
                })
              }
            />
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={item.enabled}
                onCheckedChange={(checked) =>
                  patch({
                    socialLinks: settings.socialLinks.map((row, i) =>
                      i === index ? { ...row, enabled: checked === true } : row
                    ),
                  })
                }
              />
              Megjelenítés a láblécben
            </label>
          </div>
        ))}
      </section>

      <section className="space-y-1.5 border-t border-border/40 pt-4">
        <Label className={adminFieldLabel}>Copyright sor</Label>
        <Input
          className="h-8 text-xs"
          value={settings.copyrightText}
          placeholder="© {year} {brand}"
          onChange={(e) => patch({ copyrightText: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Használd a <code className="text-foreground">{"{year}"}</code> és{" "}
          <code className="text-foreground">{"{brand}"}</code> helyőrzőket.
        </p>
      </section>
    </CmsStructureSidebar>
  )
}
