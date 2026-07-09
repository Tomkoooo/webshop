"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateOrderContactInfo } from "@wse/core/actions/admin-orders"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import { adminFieldHint, adminInputClass } from "@wse/core/lib/admin-ui"

type OrderContactEditorProps = {
  orderId: string
  billingInfo: { name: string; email: string; phone: string }
  shippingAddress: { name: string; email: string; phone: string }
  disabled?: boolean
  onSaved?: () => void
}

export function OrderContactEditor({
  orderId,
  billingInfo,
  shippingAddress,
  disabled = false,
  onSaved,
}: OrderContactEditorProps) {
  const router = useRouter()
  const [billingName, setBillingName] = useState(billingInfo.name)
  const [billingEmail, setBillingEmail] = useState(billingInfo.email)
  const [billingPhone, setBillingPhone] = useState(billingInfo.phone)
  const [shippingName, setShippingName] = useState(shippingAddress.name)
  const [shippingEmail, setShippingEmail] = useState(shippingAddress.email)
  const [shippingPhone, setShippingPhone] = useState(shippingAddress.phone)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (disabled || saving) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.set("billingName", billingName)
      formData.set("billingEmail", billingEmail)
      formData.set("billingPhone", billingPhone)
      formData.set("shippingName", shippingName)
      formData.set("shippingEmail", shippingEmail)
      formData.set("shippingPhone", shippingPhone)
      await updateOrderContactInfo(orderId, formData)
      toast.success("Kapcsolati adatok mentve.")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(`order-contact-updated:${orderId}`))
      }
      onSaved?.()
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "A mentés sikertelen."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <AdminPanel title="Számlázás">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="Név" className="sm:col-span-2">
            <input
              id={`billing-name-${orderId}`}
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              disabled={disabled || saving}
              className={adminInputClass}
              required
            />
          </AdminFormField>
          <AdminFormField label="E-mail">
            <input
              id={`billing-email-${orderId}`}
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              disabled={disabled || saving}
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Telefon">
            <input
              id={`billing-phone-${orderId}`}
              type="tel"
              value={billingPhone}
              onChange={(e) => setBillingPhone(e.target.value)}
              disabled={disabled || saving}
              className={adminInputClass}
            />
          </AdminFormField>
        </div>
      </AdminPanel>

      <AdminPanel title="Szállítás / kapcsolattartó">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminFormField label="Név" className="sm:col-span-2">
            <input
              id={`shipping-name-${orderId}`}
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
              disabled={disabled || saving}
              className={adminInputClass}
              required
            />
          </AdminFormField>
          <AdminFormField label="E-mail">
            <input
              id={`shipping-email-${orderId}`}
              type="email"
              value={shippingEmail}
              onChange={(e) => setShippingEmail(e.target.value)}
              disabled={disabled || saving}
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Telefon">
            <input
              id={`shipping-phone-${orderId}`}
              type="tel"
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              disabled={disabled || saving}
              className={adminInputClass}
            />
          </AdminFormField>
        </div>
      </AdminPanel>

      <p className={adminFieldHint}>
        A módosítások a Foxpost címkén is megjelennek — hiba esetén mentsd az adatokat, majd használd a „Címke
        újragenerálása” gombot.
      </p>

      <Button type="submit" disabled={disabled || saving}>
        {saving ? <LoadingSpinner size="xs" className="mr-2" /> : null}
        Kapcsolati adatok mentése
      </Button>
    </form>
  )
}
