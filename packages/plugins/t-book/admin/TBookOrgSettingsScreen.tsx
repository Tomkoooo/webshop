"use client"

import { useEffect, useState } from "react"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Textarea } from "@wse/core/components/ui/textarea"
import { Checkbox } from "@wse/core/components/ui/checkbox"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { tbookOrgApi } from "./org-api"
import { CurrencySelect } from "./CurrencySelect"
import {
  DEFAULT_VOUCHER_PDF_LAYOUT,
  VOUCHER_PDF_BLOCK_LABELS,
  type VoucherPdfBlock,
  type VoucherPdfLayout,
} from "../lib/voucher-pdf-layout"

type Masked = { configured: boolean; hint: string }

type OrgSettingsPayload = {
  id: string
  name: string
  settings: {
    currency: string
    stripe: {
      enabled: boolean
      publishableKey: string
      secretKey: Masked
      webhookSecret: Masked
    }
    smtp: {
      host: string
      port: number
      user: string
      fromEmail: string
      fromName: string
      pass: Masked
    }
    szamlazz: {
      enabled: boolean
      sellerName: string
      sellerBank: string
      sellerBankAccount: string
      vatPercent: number
      agentKey: Masked
    }
    emailTemplates: {
      bookingConfirmation: { subject: string; body: string }
      voucherDelivery: { subject: string; body: string }
    }
    voucherPdfLayout: VoucherPdfLayout
  }
}

type Tab = "general" | "stripe" | "smtp" | "szamlazz" | "emails" | "voucherPdf"

export function TBookOrgSettingsScreen() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>("general")
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [currency, setCurrency] = useState("HUF")

  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [stripePublishable, setStripePublishable] = useState("")
  const [stripeSecret, setStripeSecret] = useState("")
  const [stripeWebhook, setStripeWebhook] = useState("")
  const [stripeSecretHint, setStripeSecretHint] = useState("")
  const [stripeWebhookHint, setStripeWebhookHint] = useState("")

  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPass, setSmtpPass] = useState("")
  const [smtpPassHint, setSmtpPassHint] = useState("")
  const [smtpFromEmail, setSmtpFromEmail] = useState("")
  const [smtpFromName, setSmtpFromName] = useState("")

  const [szEnabled, setSzEnabled] = useState(false)
  const [szAgent, setSzAgent] = useState("")
  const [szAgentHint, setSzAgentHint] = useState("")
  const [szSeller, setSzSeller] = useState("")
  const [szBank, setSzBank] = useState("")
  const [szAccount, setSzAccount] = useState("")
  const [szVat, setSzVat] = useState(27)

  const [bookingSubject, setBookingSubject] = useState("")
  const [bookingBody, setBookingBody] = useState("")
  const [voucherSubject, setVoucherSubject] = useState("")
  const [voucherBody, setVoucherBody] = useState("")

  const [pdfLayout, setPdfLayout] = useState<VoucherPdfLayout>(DEFAULT_VOUCHER_PDF_LAYOUT)

  useEffect(() => {
    void tbookOrgApi
      .settings()
      .then((res) => {
        const org = res.organization as unknown as OrgSettingsPayload
        const s = org.settings
        setName(org.name)
        setCurrency(s.currency || "HUF")
        setStripeEnabled(s.stripe?.enabled ?? false)
        setStripePublishable(s.stripe?.publishableKey || "")
        setStripeSecretHint(s.stripe?.secretKey?.hint || "")
        setStripeWebhookHint(s.stripe?.webhookSecret?.hint || "")
        setSmtpHost(s.smtp?.host || "")
        setSmtpPort(s.smtp?.port || 587)
        setSmtpUser(s.smtp?.user || "")
        setSmtpPassHint(s.smtp?.pass?.hint || "")
        setSmtpFromEmail(s.smtp?.fromEmail || "")
        setSmtpFromName(s.smtp?.fromName || "")
        setSzEnabled(s.szamlazz?.enabled ?? false)
        setSzAgentHint(s.szamlazz?.agentKey?.hint || "")
        setSzSeller(s.szamlazz?.sellerName || "")
        setSzBank(s.szamlazz?.sellerBank || "")
        setSzAccount(s.szamlazz?.sellerBankAccount || "")
        setSzVat(s.szamlazz?.vatPercent ?? 27)
        setBookingSubject(s.emailTemplates?.bookingConfirmation?.subject || "")
        setBookingBody(s.emailTemplates?.bookingConfirmation?.body || "")
        setVoucherSubject(s.emailTemplates?.voucherDelivery?.subject || "")
        setVoucherBody(s.emailTemplates?.voucherDelivery?.body || "")
        setPdfLayout(s.voucherPdfLayout || DEFAULT_VOUCHER_PDF_LAYOUT)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      await tbookOrgApi.updateSettings({
        name,
        currency,
        stripe: {
          enabled: stripeEnabled,
          publishableKey: stripePublishable,
          ...(stripeSecret.trim() ? { secretKey: stripeSecret.trim() } : {}),
          ...(stripeWebhook.trim() ? { webhookSecret: stripeWebhook.trim() } : {}),
        },
        smtp: {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          fromEmail: smtpFromEmail,
          fromName: smtpFromName,
          ...(smtpPass.trim() ? { pass: smtpPass.trim() } : {}),
        },
        szamlazz: {
          enabled: szEnabled,
          sellerName: szSeller,
          sellerBank: szBank,
          sellerBankAccount: szAccount,
          vatPercent: szVat,
          ...(szAgent.trim() ? { agentKey: szAgent.trim() } : {}),
        },
        emailTemplates: {
          bookingConfirmation: { subject: bookingSubject, body: bookingBody },
          voucherDelivery: { subject: voucherSubject, body: voucherBody },
        },
        voucherPdfLayout: pdfLayout,
      })
      setStripeSecret("")
      setStripeWebhook("")
      setSmtpPass("")
      setSzAgent("")
      setOk("Mentve.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  function moveBlock(index: number, dir: -1 | 1) {
    setPdfLayout((prev) => {
      const blocks = [...prev.blocks]
      const next = index + dir
      if (next < 0 || next >= blocks.length) return prev
      ;[blocks[index], blocks[next]] = [blocks[next], blocks[index]]
      return { ...prev, blocks }
    })
  }

  function updateBlock(index: number, patch: Partial<VoucherPdfBlock>) {
    setPdfLayout((prev) => {
      const blocks = prev.blocks.map((b, i) => (i === index ? { ...b, ...patch } : b))
      return { ...prev, blocks }
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "Általános" },
    { id: "stripe", label: "Stripe" },
    { id: "smtp", label: "SMTP / e-mail" },
    { id: "szamlazz", label: "Számlázz.hu" },
    { id: "emails", label: "E-mail sablonok" },
    { id: "voucherPdf", label: "Jegy PDF" },
  ]

  return (
    <AdminPageScaffold
      title="Szervezet beállítások"
      description="Pénznem, saját Stripe / SMTP / számlázás, e-mail sablonok és jegy PDF elrendezés."
      actions={
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Mentés…" : "Mentés"}
        </Button>
      }
    >
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="grid max-w-lg gap-4">
          <div className="grid gap-2">
            <Label htmlFor="org-name">Név</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Alapértelmezett pénznem</Label>
            <CurrencySelect id="currency" value={currency} onValueChange={setCurrency} />
          </div>
        </div>
      ) : null}

      {tab === "stripe" ? (
        <div className="grid max-w-xl gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={stripeEnabled} onCheckedChange={(v) => setStripeEnabled(v === true)} />
            Stripe fizetés engedélyezve ehhez a szervezethez
          </label>
          <div className="grid gap-2">
            <Label>Publishable key</Label>
            <Input value={stripePublishable} onChange={(e) => setStripePublishable(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Secret key {stripeSecretHint ? `(beállítva: ${stripeSecretHint})` : ""}</Label>
            <Input
              type="password"
              placeholder={stripeSecretHint ? "Új kulcs megadása…" : "sk_live_…"}
              value={stripeSecret}
              onChange={(e) => setStripeSecret(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label>Webhook secret {stripeWebhookHint ? `(beállítva: ${stripeWebhookHint})` : ""}</Label>
            <Input
              type="password"
              placeholder={stripeWebhookHint ? "Új secret megadása…" : "whsec_…"}
              value={stripeWebhook}
              onChange={(e) => setStripeWebhook(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            A Stripe webhook URL-t a saját Stripe fiókodban állítsd be erre az oldalra. Minden szervezet
            saját kulcsokkal dolgozik.
          </p>
        </div>
      ) : null}

      {tab === "smtp" ? (
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-2">
            <Label>SMTP host</Label>
            <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" />
          </div>
          <div className="grid gap-2">
            <Label>Port</Label>
            <Input
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(Number(e.target.value) || 587)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Felhasználó</Label>
            <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Jelszó {smtpPassHint ? `(beállítva: ${smtpPassHint})` : ""}</Label>
            <Input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label>Feladó e-mail</Label>
            <Input value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Feladó név</Label>
            <Input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} />
          </div>
        </div>
      ) : null}

      {tab === "szamlazz" ? (
        <div className="grid max-w-xl gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={szEnabled} onCheckedChange={(v) => setSzEnabled(v === true)} />
            Számlázz.hu számlázás engedélyezve
          </label>
          <div className="grid gap-2">
            <Label>Agent kulcs {szAgentHint ? `(beállítva: ${szAgentHint})` : ""}</Label>
            <Input
              type="password"
              value={szAgent}
              onChange={(e) => setSzAgent(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label>Kibocsátó név</Label>
            <Input value={szSeller} onChange={(e) => setSzSeller(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Bank neve</Label>
            <Input value={szBank} onChange={(e) => setSzBank(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Bankszámlaszám</Label>
            <Input value={szAccount} onChange={(e) => setSzAccount(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>ÁFA %</Label>
            <Input
              type="number"
              value={szVat}
              onChange={(e) => setSzVat(Number(e.target.value) || 27)}
            />
          </div>
        </div>
      ) : null}

      {tab === "emails" ? (
        <div className="grid max-w-3xl gap-6">
          <p className="text-muted-foreground text-sm">
            Handlebars változók: {"{{customerName}}"}, {"{{eventName}}"}, {"{{total}}"}, {"{{currency}}"},{" "}
            {"{{bookingId}}"}, {"{{guests}}"}, {"{{voucherCount}}"}.
          </p>
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold">Foglalás visszaigazolás</h3>
            <Input value={bookingSubject} onChange={(e) => setBookingSubject(e.target.value)} placeholder="Tárgy" />
            <Textarea
              value={bookingBody}
              onChange={(e) => setBookingBody(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold">Jegy kézbesítés</h3>
            <Input value={voucherSubject} onChange={(e) => setVoucherSubject(e.target.value)} placeholder="Tárgy" />
            <Textarea
              value={voucherBody}
              onChange={(e) => setVoucherBody(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
        </div>
      ) : null}

      {tab === "voucherPdf" ? (
        <div className="grid max-w-2xl gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Margó (pt)</Label>
              <Input
                type="number"
                value={pdfLayout.margin}
                onChange={(e) =>
                  setPdfLayout((p) => ({ ...p, margin: Number(e.target.value) || 48 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Cím betűméret</Label>
              <Input
                type="number"
                value={pdfLayout.titleFontSize}
                onChange={(e) =>
                  setPdfLayout((p) => ({ ...p, titleFontSize: Number(e.target.value) || 20 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Szöveg betűméret</Label>
              <Input
                type="number"
                value={pdfLayout.bodyFontSize}
                onChange={(e) =>
                  setPdfLayout((p) => ({ ...p, bodyFontSize: Number(e.target.value) || 11 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Elsődleges szín</Label>
              <Input
                value={pdfLayout.primaryColor}
                onChange={(e) => setPdfLayout((p) => ({ ...p, primaryColor: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={pdfLayout.showPageNumbers}
              onCheckedChange={(v) => setPdfLayout((p) => ({ ...p, showPageNumbers: v === true }))}
            />
            Oldalszám megjelenítése
          </label>
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold">Blokkok sorrendje</h3>
            {pdfLayout.blocks.map((block, index) => (
              <div key={block.id} className="bg-muted/40 grid gap-2 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={block.enabled !== false}
                      onCheckedChange={(v) => updateBlock(index, { enabled: v === true })}
                    />
                    {VOUCHER_PDF_BLOCK_LABELS[block.type] || block.type}
                  </label>
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => moveBlock(index, -1)}>
                      Fel
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => moveBlock(index, 1)}>
                      Le
                    </Button>
                  </div>
                </div>
                {block.type === "customText" || block.type === "footer" ? (
                  <Textarea
                    value={block.text || ""}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                    rows={2}
                    placeholder="Egyedi szöveg…"
                  />
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPdfLayout((p) => ({
                  ...p,
                  blocks: [
                    ...p.blocks,
                    {
                      id: `custom-${Date.now()}`,
                      type: "customText",
                      enabled: true,
                      text: "",
                    },
                  ],
                }))
              }
            >
              Egyedi szövegblokk hozzáadása
            </Button>
          </div>
        </div>
      ) : null}
    </AdminPageScaffold>
  )
}
