"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { FooterSettings } from "@wse/core/services/footer-settings"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { Checkbox } from "@wse/core/components/ui/checkbox"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"

export function FooterEditor({ initial }: { initial: FooterSettings }) {
  const [state, setState] = useState<FooterSettings>(initial)
  const socialLabels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter / X",
    youtube: "YouTube",
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        A kapcsolati e-mailek, telefon és cím a <strong>Kapcsolat</strong> szakaszban szerkeszthetők. Itt a
        lábléc feliratait, linkjeit és közösségi média beállításait módosíthatod.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Lábléc szövegek</CardTitle>
          <CardDescription>Címek, feliratok és jogi sor a láblécben.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Szlogen</Label>
            <Input value={state.tagline} onChange={(e) => setState((prev) => ({ ...prev, tagline: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Gyors linkek címe</Label>
            <Input value={state.quickLinksTitle} onChange={(e) => setState((prev) => ({ ...prev, quickLinksTitle: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Kapcsolat címe</Label>
            <Input value={state.contactTitle} onChange={(e) => setState((prev) => ({ ...prev, contactTitle: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Hírlevél felirat</Label>
            <Input value={state.newsletterLabel} onChange={(e) => setState((prev) => ({ ...prev, newsletterLabel: e.target.value }))} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className={adminFieldLabel}>Hírlevél mező szövege</Label>
            <Input value={state.newsletterPlaceholder} onChange={(e) => setState((prev) => ({ ...prev, newsletterPlaceholder: e.target.value }))} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className={adminFieldLabel}>Copyright sor</Label>
            <Input value={state.copyrightText} onChange={(e) => setState((prev) => ({ ...prev, copyrightText: e.target.value }))} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className={adminFieldLabel}>Fizetési módok megjegyzés</Label>
            <Input
              value={state.paymentMethodsNote ?? ""}
              onChange={(e) => setState((prev) => ({ ...prev, paymentMethodsNote: e.target.value }))}
              placeholder="Fizetés: bankkártya (Stripe)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Szervező blokk</CardTitle>
          <CardDescription>Opcionális Mineshow / tábor lábléc adatok.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Cím</Label>
            <Input value={state.organizerSection?.title ?? ""} onChange={(e) => setState((prev) => ({ ...prev, organizerSection: { ...prev.organizerSection!, title: e.target.value } }))} />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Cégnév</Label>
            <Input value={state.organizerSection?.companyName ?? ""} onChange={(e) => setState((prev) => ({ ...prev, organizerSection: { ...prev.organizerSection!, companyName: e.target.value } }))} />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Székhely</Label>
            <Input value={state.organizerSection?.registeredAddress ?? ""} onChange={(e) => setState((prev) => ({ ...prev, organizerSection: { ...prev.organizerSection!, registeredAddress: e.target.value } }))} />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Levelezési cím</Label>
            <Input value={state.organizerSection?.mailingAddress ?? ""} onChange={(e) => setState((prev) => ({ ...prev, organizerSection: { ...prev.organizerSection!, mailingAddress: e.target.value } }))} />
          </div>
          <div className="space-y-1.5">
            <Label className={adminFieldLabel}>Nyitvatartás</Label>
            <Input value={state.organizerSection?.openingHours ?? ""} onChange={(e) => setState((prev) => ({ ...prev, organizerSection: { ...prev.organizerSection!, openingHours: e.target.value } }))} />
          </div>
          <p className="text-xs text-muted-foreground">A tábor helyszíne a főoldal Kapcsolat szekciójában szerkeszthető.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kapcsolati sorok</CardTitle>
          <CardDescription>Kulcs–érték párok a lábléc kapcsolat oszlopában (szöveg, link, e-mail, telefon).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(state.contactEntries ?? []).map((item, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-[120px_1fr_1fr_auto] md:items-center">
              <select
                className="h-9 rounded-md border-0 bg-background px-2 text-sm ring-1 ring-border/60"
                value={item.kind}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    contactEntries: (prev.contactEntries ?? []).map((row, idx) =>
                      idx === index ? { ...row, kind: e.target.value as typeof item.kind } : row
                    ),
                  }))
                }
              >
                <option value="text">Szöveg</option>
                <option value="link">Link</option>
                <option value="mailto">E-mail</option>
                <option value="tel">Telefon</option>
              </select>
              <Input
                value={item.label}
                placeholder="Felirat"
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    contactEntries: (prev.contactEntries ?? []).map((row, idx) =>
                      idx === index ? { ...row, label: e.target.value } : row
                    ),
                  }))
                }
              />
              <Input
                value={item.value}
                placeholder="Érték"
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    contactEntries: (prev.contactEntries ?? []).map((row, idx) =>
                      idx === index ? { ...row, value: e.target.value } : row
                    ),
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    contactEntries: (prev.contactEntries ?? []).filter((_, idx) => idx !== index),
                  }))
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                contactEntries: [...(prev.contactEntries ?? []), { label: "", value: "", kind: "text" }],
              }))
            }
          >
            <Plus className="size-3.5" />
            Kapcsolati sor
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gyors linkek</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.quickLinks.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex flex-wrap gap-2">
              <Input value={item.label} placeholder="Felirat" className="w-36" onChange={(e) => setState((prev) => ({ ...prev, quickLinks: prev.quickLinks.map((current, idx) => (idx === index ? { ...current, label: e.target.value } : current)) }))} />
              <Input value={item.href} placeholder="/oldal vagy https://…" className="min-w-[12rem] flex-1" onChange={(e) => setState((prev) => ({ ...prev, quickLinks: prev.quickLinks.map((current, idx) => (idx === index ? { ...current, href: e.target.value } : current)) }))} />
              <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setState((prev) => ({ ...prev, quickLinks: prev.quickLinks.filter((_, idx) => idx !== index) }))}>
                <Trash2 className="size-3.5" />
                Törlés
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setState((prev) => ({ ...prev, quickLinks: [...prev.quickLinks, { label: "Új link", href: "#" }] }))}>
            <Plus className="size-3.5" />
            Link hozzáadása
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Közösségi média</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.socialLinks.map((item, index) => (
            <div key={item.platform} className="grid gap-3 md:grid-cols-[140px_1fr_auto] md:items-center">
              <Label className={adminFieldLabel}>{socialLabels[item.platform] || item.platform}</Label>
              <Input value={item.url} placeholder="https://…" onChange={(e) => setState((prev) => ({ ...prev, socialLinks: prev.socialLinks.map((current, idx) => (idx === index ? { ...current, url: e.target.value } : current)) }))} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={item.enabled} onCheckedChange={(v) => setState((prev) => ({ ...prev, socialLinks: prev.socialLinks.map((current, idx) => (idx === index ? { ...current, enabled: v === true } : current)) }))} />
                Aktív
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        type="button"
        onClick={async () => {
          const response = await fetch("/api/admin/footer", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(state),
          })
          if (!response.ok) {
            toast.error("Lábléc mentése sikertelen")
            return
          }
          toast.success("Lábléc mentve")
        }}
      >
        Lábléc mentése
      </Button>
    </div>
  )
}
