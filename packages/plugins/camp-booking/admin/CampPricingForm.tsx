"use client"

import type { CampPricingSettings } from "./camp-api"
import { CampAdminField, CampAdminInput, CampAdminPrimaryButton } from "./camp-admin-ui"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import { adminSectionTitle } from "@wse/core/lib/admin-ui"

type Props = {
  settings: CampPricingSettings
  onChange: (s: CampPricingSettings) => void
  onSave: () => void
  saving: boolean
}

export function CampPricingForm({ settings, onChange, onSave, saving }: Props) {
  return (
    <AdminPanel className="border border-amber-500/20 bg-amber-500/5 shadow-none">
      <h3 className={adminSectionTitle}>Kedvezmények & szabályok</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
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
        <label className="flex items-end gap-3 pb-2 text-sm text-foreground">
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
      <CampAdminPrimaryButton type="button" disabled={saving} onClick={onSave}>
        {saving ? "Mentés…" : "Kedvezmények mentése"}
      </CampAdminPrimaryButton>
    </AdminPanel>
  )
}
