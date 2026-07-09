"use client"

import type { Dispatch, SetStateAction } from "react"
import { EditableLogo } from "@wse/core/features/site-settings/components/EditableLogo"
import { EditableBrandName } from "@wse/core/features/site-settings/components/EditableBrandName"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"

export type CmsBrandingToolbarState = {
  brandName: string
  logoNav: string
  logoFooter: string
  logoHero: string
}

type DispatchBranding = Dispatch<SetStateAction<CmsBrandingToolbarState>>

async function persistBranding(patch: Partial<CmsBrandingToolbarState>) {
  await fetch("/api/admin/branding", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  })
}

export function CmsChromeBrandingToolbar({
  branding,
  setBranding,
}: {
  branding: CmsBrandingToolbarState
  setBranding: DispatchBranding
}) {
  return (
    <div className="cms-editor-branding border-b border-border/40 bg-muted/30 px-4 py-5 space-y-5">
      <p className="text-sm font-medium text-foreground">Böngésző fejléc és lábléc</p>

      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 text-center">
        <label htmlFor="cms-shop-display-name" className={adminFieldLabel}>
          Bolt megjelenített neve
        </label>
        <EditableBrandName
          id="cms-shop-display-name"
          value={branding.brandName}
          editMode
          wrapperClassName="w-full flex justify-center"
          inputClassName="w-full max-w-md text-center rounded-md border-0 bg-background px-3 py-2 text-sm font-medium shadow-sm ring-1 ring-border/60"
          onChange={async (value: string) => {
            setBranding((prev) => ({ ...prev, brandName: value }))
            await persistBranding({ brandName: value })
          }}
        />
        <p className="text-muted-foreground max-w-md text-xs">
          Minden sablonra érvényes — navbar, dokumentum címek és e-mail láblécek.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Navbar / fejléc</p>
          <EditableLogo
            src={branding.logoNav}
            alt={branding.brandName}
            editMode
            usageLabel="Logo a felső sávban"
            recommendedSize={{ width: 512, height: 160 }}
            onChange={async (value: string) => {
              setBranding((b) => ({ ...b, logoNav: value }))
              await persistBranding({ logoNav: value })
            }}
          />
        </div>

        <div className="space-y-3 rounded-xl bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Lábléc</p>
          <EditableLogo
            src={branding.logoFooter}
            alt={branding.brandName}
            editMode
            usageLabel="Logo a láblécben"
            recommendedSize={{ width: 512, height: 160 }}
            onChange={async (value: string) => {
              setBranding((b) => ({ ...b, logoFooter: value }))
              await persistBranding({ logoFooter: value })
            }}
          />
        </div>
      </div>
    </div>
  )
}
