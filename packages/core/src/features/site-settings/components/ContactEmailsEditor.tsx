"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import type { ContactEmailEntry } from "@wse/core/lib/contact-emails"

function newEntry(): ContactEmailEntry {
  return {
    id: crypto.randomUUID(),
    label: "",
    email: "",
  }
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
    <div className="space-y-10">
      <p className="text-sm text-neutral-400 max-w-2xl">
        Ez az egyetlen hely, ahonnan a weboldal e-mail címeit veszi (kapcsolat szekció, lábléc, űrlap). Több
        cím esetén a látogató kiválaszthatja a címzettet.
      </p>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end bg-white/5 border border-white/10 p-4"
          >
            <label className="space-y-1 block">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400">Megjelenő név</span>
              <input
                value={entry.label}
                onChange={(event) =>
                  setEntries((prev) =>
                    prev.map((row, idx) =>
                      idx === index ? { ...row, label: event.target.value } : row
                    )
                  )
                }
                placeholder="pl. Értékesítés"
                className="w-full h-10 px-3 bg-black border border-white/20 text-white text-sm"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400">E-mail cím</span>
              <input
                type="email"
                value={entry.email}
                onChange={(event) =>
                  setEntries((prev) =>
                    prev.map((row, idx) =>
                      idx === index ? { ...row, email: event.target.value } : row
                    )
                  )
                }
                placeholder="ertekesites@example.com"
                className="w-full h-10 px-3 bg-black border border-white/20 text-white text-sm"
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              disabled={entries.length <= 1}
              onClick={() => setEntries((prev) => prev.filter((_, idx) => idx !== index))}
              className="h-10 rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-30"
              aria-label="E-mail törlése"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setEntries((prev) => [...prev, newEntry()])}
          className="rounded-md border-white/20 text-white hover:bg-white/10 h-11 text-xs font-medium text-muted-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Új e-mail
        </Button>
      </div>

      {showShopOrderEmails ? (
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="space-y-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Új rendelés értesítések
          </h3>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Ide küldünk e-mailt minden sikeresen létrejött rendelésről. Üres lista esetén nem megy belső új rendelés
            értesítés.
          </p>
        </div>

        <div className="space-y-3">
          {newOrderEmails.map((email, index) => (
            <div
              key={`new-order-${index}`}
              className="grid gap-3 md:grid-cols-[1fr_auto] items-end bg-white/5 border border-emerald-500/20 p-4"
            >
              <label className="space-y-1 block">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400">E-mail cím</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setNewOrderEmails((prev) =>
                      prev.map((row, idx) => (idx === index ? event.target.value : row))
                    )
                  }
                  placeholder="rendelesek@example.com"
                  className="w-full h-10 px-3 bg-black border border-white/20 text-white text-sm"
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                disabled={newOrderEmails.length <= 1}
                onClick={() => setNewOrderEmails((prev) => prev.filter((_, idx) => idx !== index))}
                className="h-10 rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-30"
                aria-label="Új rendelés értesítési e-mail törlése"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setNewOrderEmails((prev) => [...prev, ""])}
          className="rounded-md border-white/20 text-white hover:bg-white/10 h-11 text-xs font-medium text-muted-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Új rendelés értesítő
        </Button>
      </div>
      ) : null}

      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="space-y-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Számlázási hiba értesítések
          </h3>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Ide érkeznek az automatikus számlázás sikertelen próbálkozásairól küldött „INVOICE ERROR” levelek.
            Üres lista esetén az első kapcsolati e-mail (vagy a környezeti{" "}
            <code className="text-neutral-500">INVOICE_ERROR_ALERT_EMAIL</code>) marad az alapértelmezett.
          </p>
        </div>

        <div className="space-y-3">
          {invoiceAlertEmails.map((email, index) => (
            <div
              key={`invoice-alert-${index}`}
              className="grid gap-3 md:grid-cols-[1fr_auto] items-end bg-white/5 border border-amber-500/20 p-4"
            >
              <label className="space-y-1 block">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400">E-mail cím</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setInvoiceAlertEmails((prev) =>
                      prev.map((row, idx) => (idx === index ? event.target.value : row))
                    )
                  }
                  placeholder="szamlazas@example.com"
                  className="w-full h-10 px-3 bg-black border border-white/20 text-white text-sm"
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                disabled={invoiceAlertEmails.length <= 1}
                onClick={() =>
                  setInvoiceAlertEmails((prev) => prev.filter((_, idx) => idx !== index))
                }
                className="h-10 rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-30"
                aria-label="Értesítési e-mail törlése"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setInvoiceAlertEmails((prev) => [...prev, ""])}
          className="rounded-md border-white/20 text-white hover:bg-white/10 h-11 text-xs font-medium text-muted-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Új számlázási értesítő
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          type="button"
          disabled={saving}
          onClick={async () => {
            const valid = entries.filter((row) => row.email.trim())
            if (valid.length === 0) {
              toast.error("Legalább egy érvényes kapcsolati e-mail cím szükséges.")
              return
            }
            const validInvoiceAlerts = invoiceAlertEmails
              .map((row) => row.trim())
              .filter((row) => row.length > 0)
            const validNewOrderEmails = newOrderEmails
              .map((row) => row.trim())
              .filter((row) => row.length > 0)
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
          className="rounded-md bg-primary hover:bg-primary/85 text-white h-11 text-xs font-medium text-muted-foreground min-w-[160px]"
        >
          {saving ? "Mentés…" : "Mentés"}
        </Button>
      </div>
    </div>
  )
}
