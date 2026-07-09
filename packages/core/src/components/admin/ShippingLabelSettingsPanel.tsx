"use client"

import * as React from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { updateShippingLabelSettings } from "@wse/core/actions/admin-orders"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import type { ShippingLabelSettings } from "@wse/core/services/shipping-label-settings"

const inputClass =
  "h-10 w-full bg-background border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground rounded-md focus:border-primary/60 focus:outline-none"
const labelClass = "text-xs font-medium text-muted-foreground text-muted-foreground mb-1 block"

type ShippingLabelSettingsPanelProps = {
  initial: ShippingLabelSettings
}

export function ShippingLabelSettingsPanel({ initial }: ShippingLabelSettingsPanelProps) {
  const [form, setForm] = React.useState(initial)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setForm(initial)
  }, [initial])

  const set = (key: keyof ShippingLabelSettings, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      for (const [key, value] of Object.entries(form)) {
        formData.set(key, value)
      }
      await updateShippingLabelSettings(formData)
      toast.success("Feladó adatok mentve.")
    } catch {
      toast.error("A mentés sikertelen.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-border bg-muted/50 p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Webshop címke — feladó adatok</h2>
        <p className="mt-1 text-sm italic text-muted-foreground">
          Ezek jelennek meg a házhozszállítás PDF címkéken. A szállítási leírás a rendeléshez tartozó szállítási
          mód admin beállításából kerül a PDF-be.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass}>Cégnév / feladó neve</label>
          <input
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Utca, házszám</label>
          <input value={form.companyStreet} onChange={(e) => set("companyStreet", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Irányítószám</label>
          <input value={form.companyZip} onChange={(e) => set("companyZip", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Város</label>
          <input value={form.companyCity} onChange={(e) => set("companyCity", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Ország</label>
          <input value={form.companyCountry} onChange={(e) => set("companyCountry", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Adószám</label>
          <input value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Telefon</label>
          <input value={form.companyPhone} onChange={(e) => set("companyPhone", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>E-mail</label>
          <input
            type="email"
            value={form.companyEmail}
            onChange={(e) => set("companyEmail", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Lábléc megjegyzés a címkén</label>
          <textarea
            value={form.footerNote}
            onChange={(e) => set("footerNote", e.target.value)}
            rows={3}
            className={cnTextarea}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="h-10 rounded-md bg-primary px-6 text-xs font-medium text-muted-foreground text-primary-foreground hover:bg-primary/80"
      >
        {saving ? <LoadingSpinner size="xs" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
        Mentés
      </Button>
    </form>
  )
}

const cnTextarea =
  "w-full bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground rounded-md focus:border-primary/60 focus:outline-none min-h-[80px]"
