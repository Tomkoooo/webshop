"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { cn } from "@wse/core/lib/utils"
import { adminFieldHint, adminInputClass } from "@wse/core/lib/admin-ui"
import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor"

interface MethodDialogProps {
  children: React.ReactNode
  title: string
  action: (formData: FormData) => Promise<void>
  initialData?: {
    name?: string
    grossPrice?: number
    isActive?: boolean
    provider?: string
    descriptionHtml?: string
  }
  /** When set, shows provider type (standard / GLS / Foxpost) for shipping methods. */
  shippingProviderMode?: boolean
}

export function MethodDialog({
  children,
  title,
  action,
  initialData,
  shippingProviderMode = false,
}: MethodDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isActive, setIsActive] = React.useState(initialData?.isActive ?? true)
  const [provider, setProvider] = React.useState(initialData?.provider ?? "standard")
  const [descriptionHtml, setDescriptionHtml] = React.useState(initialData?.descriptionHtml ?? "")
  const showParcelDescription = provider === "gls" || provider === "foxpost"

  React.useEffect(() => {
    if (!open) return
    setIsActive(initialData?.isActive ?? true)
    setProvider(initialData?.provider ?? "standard")
    setDescriptionHtml(initialData?.descriptionHtml ?? "")
  }, [open, initialData])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await action(formData)
            setOpen(false)
          }}
          className="space-y-6 py-2 pr-1"
        >
          {shippingProviderMode ? (
            <AdminFormField
              label="Típus (pénztár)"
              hint="GLS/Foxpost típusnál a pénztárban megjelenik a választó; az ár itt állítható. A GLS/Foxpost kapcsolókat a Beállítások menüben kapcsold be."
            >
              <select
                name="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className={cn(adminInputClass, "h-10")}
              >
                <option value="standard">Házhozszállítás / standard</option>
                <option value="gls">GLS csomagpont (térkép + ár)</option>
                <option value="foxpost">Foxpost automata (APT + ár)</option>
              </select>
            </AdminFormField>
          ) : null}

          <AdminFormField label="Megnevezés">
            <Input
              name="name"
              defaultValue={initialData?.name}
              required
              placeholder="Pl. Házhozszállítás"
              className={cn(adminInputClass, "h-10")}
            />
          </AdminFormField>

          {showParcelDescription ? (
            <AdminFormField
              label="Leírás a pénztárban (HTML)"
              hint="Megjelenik, ha a vásárló ezt a csomagpontos / automatás szállítást választja (összegzés lépésen is)."
            >
              <RichTextEditor
                value={descriptionHtml}
                onChange={setDescriptionHtml}
                className="max-w-full"
                editorClassName="max-h-[38dvh] min-h-[180px] overflow-y-auto break-words"
              />
              <input type="hidden" name="descriptionHtml" value={descriptionHtml} />
            </AdminFormField>
          ) : (
            <input type="hidden" name="descriptionHtml" value="" />
          )}

          <AdminFormField label="Bruttó ár (Ft)">
            <Input
              name="grossPrice"
              type="number"
              defaultValue={initialData?.grossPrice}
              required
              placeholder="0"
              className={cn(adminInputClass, "h-10")}
            />
          </AdminFormField>

          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium">Aktív</p>
              <p className={adminFieldHint}>Látható a pénztárban</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "h-6 w-11 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "bg-primary" : "bg-muted"
              )}
              aria-pressed={isActive}
            >
              <div
                className={cn(
                  "size-5 rounded-full bg-background shadow-sm transition-transform",
                  isActive ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
            <input type="hidden" name="isActive" value={isActive.toString()} />
          </div>

          <Button type="submit" className="w-full">
            {initialData ? "Módosítások mentése" : "Létrehozás"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
