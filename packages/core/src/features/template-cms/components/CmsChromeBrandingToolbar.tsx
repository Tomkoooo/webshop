"use client"

import { EditableLogo } from "@wse/core/features/site-settings/components/EditableLogo"
import { EditableBrandName } from "@wse/core/features/site-settings/components/EditableBrandName"
/** Brand state shared by homepage + JSON surface editors in the CMS chrome strip. */
export type CmsBrandingToolbarState = {
  brandName: string
  logoNav: string
  logoFooter: string
  logoHero: string
}

type DispatchBranding = React.Dispatch<React.SetStateAction<CmsBrandingToolbarState>>

async function persistBranding(patch: Partial<CmsBrandingToolbarState>) {
  await fetch("/api/admin/branding", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  })
}

/**
 * Navbar + footer logos and global shop display name.
 * Structured so uploads sit under “Navbar” vs “Footer” instead of floating in one row next to the name.
 */
export function CmsChromeBrandingToolbar({
  branding,
  setBranding,
}: {
  branding: CmsBrandingToolbarState
  setBranding: DispatchBranding
}) {
  return (
    <div className="px-4 py-4 border-b border-white/10 bg-black/40 space-y-6">
      <p className="text-[10px] uppercase tracking-widest text-neutral-400">
        Böngésző fejléc &amp; lábléc megjelenés
      </p>

      <div className="flex flex-col items-center gap-2 max-w-xl mx-auto w-full text-center">
        <label
          htmlFor="cms-shop-display-name"
          className="block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400"
        >
          Bolt megjelenített neve
        </label>
        <EditableBrandName
          id="cms-shop-display-name"
          value={branding.brandName}
          editMode
          wrapperClassName="w-full flex justify-center"
          inputClassName="w-full max-w-md text-center rounded border border-white/20 bg-black/40 px-3 py-2 text-sm font-medium tracking-tight text-white"
          onChange={async (value: string) => {
            setBranding((prev) => ({ ...prev, brandName: value }))
            await persistBranding({ brandName: value })
          }}
        />
        <p className="text-[10px] text-neutral-500 max-w-md">
          Minden sablon közös beállítás — megjelenik a Navbar-on, dokumentum címekben és e-mail láblécekben
          típus szerint.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/90">Navbar / fejléc</p>
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

        <div className="space-y-3 rounded-lg border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/90">Lábléc</p>
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
