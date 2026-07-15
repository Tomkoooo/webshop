"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { TBookField, TBookInput } from "./t-book-admin-ui"
import { tBookAdminApi } from "./t-book-api"

export function SendVoucherDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultEmail,
  defaultName,
  voucherId,
  bookingId,
  onSent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  defaultEmail?: string
  defaultName?: string
  voucherId?: string
  bookingId?: string
  onSent?: () => void
}) {
  const [email, setEmail] = useState(defaultEmail ?? "")
  const [recipientName, setRecipientName] = useState(defaultName ?? "")
  const [busy, setBusy] = useState(false)

  const handleOpen = (next: boolean) => {
    if (next) {
      setEmail(defaultEmail ?? "")
      setRecipientName(defaultName ?? "")
    }
    onOpenChange(next)
  }

  const send = async () => {
    setBusy(true)
    try {
      await tBookAdminApi("vouchers/send", {
        method: "POST",
        body: JSON.stringify({
          voucherId,
          bookingId,
          email: email.trim(),
          recipientName: recipientName.trim(),
        }),
      })
      onSent?.()
      handleOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Küldés sikertelen")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        <div className="space-y-4 pt-2">
          <TBookField label="Címzett neve">
            <TBookInput
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Teljes név"
            />
          </TBookField>
          <TBookField label="E-mail cím">
            <TBookInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.hu"
            />
          </TBookField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpen(false)}>
              Mégse
            </Button>
            <Button type="button" disabled={busy} onClick={() => void send()}>
              {busy ? "Küldés…" : "Jegy küldése"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
