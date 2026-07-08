"use client"

import type { CampPricingSettings } from "./camp-api"
import { CampAdminField, CampAdminInput } from "./camp-admin-ui"
import { Button } from "@wse/core/components/ui/button"

type Props = {
  settings: CampPricingSettings
  onChange: (s: CampPricingSettings) => void
  onSave: () => void
  saving: boolean
}

export function CampPricingForm({ settings, onChange, onSave, saving }: Props) {
  return (
    <div className="border border-amber-500/30 bg-amber-950/20 rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-amber-300">
        Kedvezmények & szabályok
      </h3>
      <p className="text-xs text-neutral-400 leading-relaxed">
        Többgyermekes kedvezmény: minimum gyerekszám után. Testvérkedvezmény: azonos vezetéknév
        (külön mező vagy a név első szava) legalább két gyereknél. Ha mindkettő érvényes, a
        magasabb százalék kerül alkalmazásra.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <CampAdminField label="Többgyermekes kedvezmény (%)">
          <CampAdminInput
            type="number"
            min={0}
            max={100}
            value={settings.multiChildDiscountPercent}
            onChange={(e) =>
              onChange({ ...settings, multiChildDiscountPercent: Number(e.target.value) })
            }
          />
        </CampAdminField>
        <CampAdminField label="Minimum gyerekszám">
          <CampAdminInput
            type="number"
            min={2}
            value={settings.multiChildMinCount}
            onChange={(e) =>
              onChange({ ...settings, multiChildMinCount: Number(e.target.value) })
            }
          />
        </CampAdminField>
        <CampAdminField label="Testvérkedvezmény (%)">
          <CampAdminInput
            type="number"
            min={0}
            max={100}
            value={settings.siblingDiscountPercent}
            onChange={(e) =>
              onChange({ ...settings, siblingDiscountPercent: Number(e.target.value) })
            }
          />
        </CampAdminField>
        <label className="flex items-end gap-3 pb-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={settings.siblingMatchByLastName}
            onChange={(e) =>
              onChange({ ...settings, siblingMatchByLastName: e.target.checked })
            }
            className="size-4 accent-primary"
          />
          Testvér párosítás vezetéknév alapján
        </label>
      </div>
      <Button
        type="button"
        variant="krausz"
        disabled={saving}
        onClick={onSave}
        className="h-11 px-6 uppercase tracking-widest text-[10px] font-black"
      >
        {saving ? "Mentés…" : "Kedvezmények mentése"}
      </Button>
    </div>
  )
}
