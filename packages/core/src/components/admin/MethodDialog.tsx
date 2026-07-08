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
import { Label } from "@wse/core/components/ui/label"
import { cn } from "@wse/core/lib/utils"
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-black border-white/10 text-white rounded-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black uppercase italic tracking-wider text-white">
            {title}
          </DialogTitle>
        </DialogHeader>
        <form action={async (formData) => {
          await action(formData)
          setOpen(false)
        }} className="space-y-8 py-6 pr-1">
          {shippingProviderMode ? (
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                Típus (pénztár)
              </Label>
              <select
                name="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="h-12 w-full border border-white/10 bg-black px-3 text-sm font-bold uppercase tracking-widest text-white"
              >
                <option value="standard">Házhozszállítás / standard</option>
                <option value="gls">GLS csomagpont (térkép + ár)</option>
                <option value="foxpost">Foxpost automata (APT + ár)</option>
              </select>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                GLS/Foxpost típusnál a pénztárban megjelenik a választó; az ár itt állítható. A GLS/Foxpost
                kapcsolókat a Beállítások menüben kapcsold be.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Megnevezés</Label>
            <Input 
              name="name" 
              defaultValue={initialData?.name}
              required 
              placeholder="PL. HÁZHOZSZÁLLÍTÁS"
              className="bg-black border-white/5 h-12 text-white font-bold uppercase tracking-widest focus-visible:ring-primary rounded-none"
            />
          </div>
          {showParcelDescription ? (
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                Leírás a pénztárban (HTML)
              </Label>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                Megjelenik, ha a vásárló ezt a csomagpontos / automatás szállítást választja (összegzés lépésen is).
              </p>
              <RichTextEditor
                value={descriptionHtml}
                onChange={setDescriptionHtml}
                className="max-w-full"
                editorClassName="max-h-[38dvh] min-h-[180px] overflow-y-auto break-words"
              />
              <input type="hidden" name="descriptionHtml" value={descriptionHtml} />
            </div>
          ) : (
            <input type="hidden" name="descriptionHtml" value="" />
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Bruttó Ár (FT)</Label>
            <Input 
              name="grossPrice" 
              type="number"
              defaultValue={initialData?.grossPrice}
              required 
              placeholder="0"
              className="bg-black border-white/5 h-12 text-white font-black tracking-widest focus-visible:ring-primary rounded-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5">
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">AKTÍV</p>
              <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mt-1">LÁTHATÓ A PÉNZTÁRBAN</p>
            </div>
            <button 
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "w-12 h-6 rounded-none p-1 transition-colors duration-200 focus:outline-none",
                isActive ? "bg-primary" : "bg-neutral-800"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white transition-transform duration-200",
                isActive ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
            <input type="hidden" name="isActive" value={isActive.toString()} />
          </div>

          <div className="pt-4">
            <Button type="submit" variant="krausz" className="w-full h-14 tracking-[0.2em]">
              {initialData ? "MÓDOSÍTÁSOK MENTÉSE" : "LÉTREHOZÁS"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
