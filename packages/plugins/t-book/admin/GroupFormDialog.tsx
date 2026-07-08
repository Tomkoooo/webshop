"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { TBOOK_DEFAULT_VAT_PERCENT } from "../lib/vat"
import type { TBookPriceBasis } from "../lib/vat"
import type { TBookOptionDef } from "../lib/pricing-types"
import { tBookAdminApi, type AdminGroup } from "./t-book-api"
import { TBookField, TBookInput, TBookSelect } from "./t-book-admin-ui"
import { TBookWizard } from "./TBookWizard"
import { TBookRichTextField } from "./TBookRichTextField"
import { OptionSchemaEditor } from "./OptionSchemaEditor"
import { TBOOK_VAT_PRESETS } from "../lib/vat"

const STEPS = [
  { id: "basics", title: "Alapadatok" },
  { id: "description", title: "Leírás" },
  { id: "options", title: "Foglalási opciók" },
]

type GroupDraft = {
  name: string
  description: string
  status: AdminGroup["status"]
  defaultBookingOptions: TBookOptionDef[]
  defaultPriceBasis: TBookPriceBasis
  defaultVatPercent: number
}

function draftFromGroup(group: AdminGroup | null): GroupDraft {
  return {
    name: group?.name ?? "",
    description: group?.description ?? "",
    status: group?.status ?? "draft",
    defaultBookingOptions: group?.defaultBookingOptions ?? [],
    defaultPriceBasis: group?.defaultPriceBasis ?? "net",
    defaultVatPercent: group?.defaultVatPercent ?? TBOOK_DEFAULT_VAT_PERCENT,
  }
}

export function GroupFormDialog({
  group,
  open,
  onOpenChange,
  onSaved,
}: {
  group: AdminGroup | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (result: { apiKey?: string; groupId?: string }) => void
}) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<GroupDraft>(() => draftFromGroup(group))

  useEffect(() => {
    if (open) {
      setStep(0)
      setDraft(draftFromGroup(group))
    }
  }, [open, group])

  const patch = (partial: Partial<GroupDraft>) => setDraft((d) => ({ ...d, ...partial }))

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("A csoport neve kötelező.")
      setStep(0)
      return
    }
    setSaving(true)
    const payload = {
      name: draft.name.trim(),
      description: draft.description,
      status: draft.status,
      defaultBookingOptions: draft.defaultBookingOptions,
      defaultPriceBasis: draft.defaultPriceBasis,
      defaultVatPercent: draft.defaultVatPercent,
    }
    try {
      if (group) {
        await tBookAdminApi(`groups/${group.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("Csoport mentve")
        onSaved({ groupId: group.id })
      } else {
        const result = await tBookAdminApi<{ apiKey: string; id: string }>("groups", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Csoport létrehozva")
        onSaved({ apiKey: result.apiKey, groupId: result.id })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group ? "Csoport szerkesztése" : "Új eseménycsoport"}</DialogTitle>
        </DialogHeader>
        <TBookWizard
          steps={STEPS}
          currentStep={step}
          onStepChange={setStep}
          onSubmit={() => void save()}
          submitting={saving}
          submitLabel={group ? "Mentés" : "Létrehozás"}
        >
          {step === 0 ? (
            <div className="space-y-4">
              <TBookField label="Név">
                <TBookInput
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Nyári fesztiválok 2026"
                  required
                />
              </TBookField>
              <TBookField label="Státusz">
                <TBookSelect
                  value={draft.status}
                  onChange={(e) => patch({ status: e.target.value as GroupDraft["status"] })}
                >
                  <option value="draft">Vázlat</option>
                  <option value="active">Aktív</option>
                  <option value="archived">Archivált</option>
                </TBookSelect>
              </TBookField>
            </div>
          ) : null}
          {step === 1 ? (
            <TBookRichTextField
              label="Leírás"
              value={draft.description}
              onChange={(description) => patch({ description })}
            />
          ) : null}
          {step === 2 ? (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">
                Ezek az opciók alapból elérhetők minden eseménynél ebben a csoportban (a szállás
                szintű opciókkal együtt).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TBookField label="Opciók ár típusa">
                  <TBookSelect
                    value={draft.defaultPriceBasis}
                    onChange={(e) =>
                      patch({ defaultPriceBasis: e.target.value as GroupDraft["defaultPriceBasis"] })
                    }
                  >
                    <option value="net">Nettó</option>
                    <option value="gross">Bruttó</option>
                  </TBookSelect>
                </TBookField>
                <TBookField label="Alapértelmezett ÁFA %">
                  <TBookSelect
                    value={String(draft.defaultVatPercent)}
                    onChange={(e) => patch({ defaultVatPercent: Number(e.target.value) })}
                  >
                    {TBOOK_VAT_PRESETS.map((vat) => (
                      <option key={vat} value={vat}>
                        {vat}%
                      </option>
                    ))}
                  </TBookSelect>
                </TBookField>
              </div>
              <OptionSchemaEditor
                options={draft.defaultBookingOptions}
                onChange={(defaultBookingOptions) => patch({ defaultBookingOptions })}
              />
            </div>
          ) : null}
        </TBookWizard>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full h-10 border-white/10 text-white mt-2"
        >
          Mégse
        </Button>
      </DialogContent>
    </Dialog>
  )
}
