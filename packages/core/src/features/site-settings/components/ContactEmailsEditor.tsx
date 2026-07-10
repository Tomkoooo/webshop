"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import type { ContactEmailEntry } from "@wse/core/lib/contact-emails"

function newEntry(): ContactEmailEntry {
  return {
    id: crypto.randomUUID(),
    label: "",
    email: "",
  }
}

function EmailRow({
  label,
  email,
  onLabelChange,
  onEmailChange,
  onRemove,
  canRemove,
  labelPlaceholder = "pl. Értékesítés",
  emailPlaceholder = "ertekesites@example.com",
}: {
  label: string
  email: string
  onLabelChange?: (value: string) => void
  onEmailChange: (value: string) => void
  onRemove: () => void
  canRemove: boolean
  labelPlaceholder?: string
  emailPlaceholder?: string
}) {
  return (
    <div className="grid items-end gap-3 rounded-lg bg-muted/40 p-4 md:grid-cols-[1fr_1fr_auto]">
      {onLabelChange ? (
        <div className="space-y-1.5">
          <Label className={adminFieldLabel}>Megjelenő név</Label>
          <Input value={label} onChange={(e) => onLabelChange(e.target.value)} placeholder={labelPlaceholder} />
        </div>
      ) : null}
      <div className={onLabelChange ? "space-y-1.5" : "space-y-1.5 md:col-span-2"}>
        <Label className={adminFieldLabel}>E-mail cím</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={emailPlaceholder}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canRemove}
        onClick={onRemove}
        className="text-destructive hover:bg-destructive/10"
        aria-label="E-mail törlése"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

export function ContactEmailsEditor({
  initial,
  initialInvoiceErrorAlertEmails,
  initialNewOrderNotificationEmails,
  showShopOrderEmails = true,
}: {
  initial: ContactEmailEntry[]
  initialInvoiceErrorAlertEmails: string[]
  initialNewOrderNotificationEmails: string[]
  showShopOrderEmails?: boolean
}) {
  const [entries, setEntries] = useState<ContactEmailEntry[]>(
    initial.length > 0 ? initial : [newEntry()]
  )
  const [invoiceAlertEmails, setInvoiceAlertEmails] = useState<string[]>(
    initialInvoiceErrorAlertEmails.length > 0 ? initialInvoiceErrorAlertEmails : [""]
  )
  const [newOrderEmails, setNewOrderEmails] = useState<string[]>(
    initialNewOrderNotificationEmails.length > 0 ? initialNewOrderNotificationEmails : [""]
  )
  const [saving, setSaving] = useState(false)

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Ez az egyetlen hely, ahonnan a weboldal e-mail címeit veszi (kapcsolat szekció, lábléc, űrlap). Több
        cím esetén a látogató kiválaszthatja a címzettet.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Kapcsolati e-mailek</CardTitle>
          <CardDescription>Megjelenő név és cím párok a honlapon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.map((entry, index) => (
            <EmailRow
              key={entry.id}
              label={entry.label}
              email={entry.email}
              onLabelChange={(value) =>
                setEntries((prev) =>
                  prev.map((row, idx) => (idx === index ? { ...row, label: value } : row))
                )
              }
              onEmailChange={(value) =>
                setEntries((prev) =>
                  prev.map((row, idx) => (idx === index ? { ...row, email: value } : row))
                )
              }
              onRemove={() => setEntries((prev) => prev.filter((_, idx) => idx !== index))}
              canRemove={entries.length > 1}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setEntries((prev) => [...prev, newEntry()])}>
            <Plus className="size-4" />
            Új e-mail
          </Button>
        </CardContent>
      </Card>

      {showShopOrderEmails ? (
        <Card>
          <CardHeader>
            <CardTitle>Új rendelés értesítések</CardTitle>
            <CardDescription>
              Ide küldünk e-mailt minden sikeresen létrejött rendelésről. Üres lista esetén nem megy belső értesítés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {newOrderEmails.map((email, index) => (
              <EmailRow
                key={`new-order-${index}`}
                label=""
                email={email}
                onEmailChange={(value) =>
                  setNewOrderEmails((prev) => prev.map((row, idx) => (idx === index ? value : row)))
                }
                onRemove={() => setNewOrderEmails((prev) => prev.filter((_, idx) => idx !== index))}
                canRemove={newOrderEmails.length > 1}
                emailPlaceholder="rendelesek@example.com"
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setNewOrderEmails((prev) => [...prev, ""])}>
              <Plus className="size-4" />
              Új rendelés értesítő
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Számlázási hiba értesítések</CardTitle>
          <CardDescription>
            Automatikus számlázás sikertelen próbálkozásairól küldött „INVOICE ERROR” levelek címzettjei.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoiceAlertEmails.map((email, index) => (
            <EmailRow
              key={`invoice-alert-${index}`}
              label=""
              email={email}
              onEmailChange={(value) =>
                setInvoiceAlertEmails((prev) => prev.map((row, idx) => (idx === index ? value : row)))
              }
              onRemove={() => setInvoiceAlertEmails((prev) => prev.filter((_, idx) => idx !== index))}
              canRemove={invoiceAlertEmails.length > 1}
              emailPlaceholder="szamlazas@example.com"
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setInvoiceAlertEmails((prev) => [...prev, ""])}>
            <Plus className="size-4" />
            Új számlázási értesítő
          </Button>
        </CardContent>
      </Card>

      <Button
        type="button"
        disabled={saving}
        onClick={async () => {
          const valid = entries.filter((row) => row.email.trim())
          if (valid.length === 0) {
            toast.error("Legalább egy érvényes kapcsolati e-mail cím szükséges.")
            return
          }
          const validInvoiceAlerts = invoiceAlertEmails.map((row) => row.trim()).filter((row) => row.length > 0)
          const validNewOrderEmails = newOrderEmails.map((row) => row.trim()).filter((row) => row.length > 0)
          setSaving(true)
          try {
            const response = await fetch("/api/admin/contact-emails", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                entries: valid,
                invoiceErrorAlertEmails: validInvoiceAlerts,
                newOrderNotificationEmails: validNewOrderEmails,
              }),
            })
            if (!response.ok) {
              toast.error("Mentés sikertelen.")
              return
            }
            const data = (await response.json()) as {
              entries: ContactEmailEntry[]
              invoiceErrorAlertEmails: string[]
              newOrderNotificationEmails: string[]
            }
            setEntries(data.entries.length > 0 ? data.entries : [newEntry()])
            setInvoiceAlertEmails(
              data.invoiceErrorAlertEmails.length > 0 ? data.invoiceErrorAlertEmails : [""]
            )
            setNewOrderEmails(
              data.newOrderNotificationEmails.length > 0 ? data.newOrderNotificationEmails : [""]
            )
            toast.success("Kapcsolat és értesítési e-mailek mentve.")
          } catch {
            toast.error("Mentés sikertelen.")
          } finally {
            setSaving(false)
          }
        }}
      >
        {saving ? "Mentés…" : "Mentés"}
      </Button>
    </div>
  )
}
