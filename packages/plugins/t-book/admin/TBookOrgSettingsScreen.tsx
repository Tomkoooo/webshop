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
      agentKey: Masked
    }
    emailTemplates: {
      bookingConfirmation: { subject: string; body: string }
      voucherDelivery: { subject: string; body: string }
    }
  }
}

type Tab = "general" | "stripe" | "smtp" | "szamlazz" | "emails"

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

  const [bookingSubject, setBookingSubject] = useState("")
  const [bookingBody, setBookingBody] = useState("")
  const [voucherSubject, setVoucherSubject] = useState("")
  const [voucherBody, setVoucherBody] = useState("")

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
        setBookingSubject(s.emailTemplates?.bookingConfirmation?.subject || "")
        setBookingBody(s.emailTemplates?.bookingConfirmation?.body || "")
        setVoucherSubject(s.emailTemplates?.voucherDelivery?.subject || "")
        setVoucherBody(s.emailTemplates?.voucherDelivery?.body || "")
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
          ...(szAgent.trim() ? { agentKey: szAgent.trim() } : {}),
        },
        emailTemplates: {
          bookingConfirmation: { subject: bookingSubject, body: bookingBody },
          voucherDelivery: { subject: voucherSubject, body: voucherBody },
        },
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
  ]

  return (
    <AdminPageScaffold
      title="Szervezet beállítások"
      description="Pénznem, saját Stripe / SMTP / számlázás és e-mail sablonok. A jegy PDF fejlécét eseményenként (vagy csoportnál) állítsd be."
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
          <p className="text-muted-foreground text-sm">
            A fizetés kártyás (Stripe), ezért banki átutalási adatok nem kellenek. Az ÁFA a jegy és a
            szállás ÁFA-beállításából kerül a számlára (esemény / hotel), nem innen.
          </p>
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
    </AdminPageScaffold>
  )
}
