import Link from "next/link"
import { TemplateService } from "@wse/core/services/template"
import { listEditablePages } from "@wse/core/templates/cms-pages"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { getAccessibleCmsSiteSettingsSections } from "@wse/core/lib/admin-settings-access"

import { PluginService } from "@wse/core/services/plugin"

export const dynamic = "force-dynamic"

export default async function AdminCmsHub() {
  const shopEnabled = isShopEnabled()
  const campBookingEnabled = await PluginService.isEnabled("camp-booking")
  const template = await TemplateService.getActive()
  const pages = listEditablePages(template, shopEnabled, campBookingEnabled)
  const cmsSettingsSections = getAccessibleCmsSiteSettingsSections(shopEnabled)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          CMS <span className="admin-text-accent">áttekintés</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-400 max-w-2xl">
          Oldalanként szerkesztheted a tartalmat, vagy a honlap szintű beállításokat (téma, SEO, márka)
          egy helyen.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">Marketing</h2>
          <p className="text-xs text-neutral-500 mt-1">Popup modálok oldalankénti megjelenítéssel.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <Link
              href="/admin/cms/popups"
              className="block h-full rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-4 transition hover:border-amber-400/40 hover:bg-amber-500/10"
            >
              <span className="text-sm font-bold uppercase tracking-widest text-amber-100">
                Popup bannerek
              </span>
              <span className="mt-2 block text-xs font-normal normal-case tracking-normal text-neutral-400">
                Kép, szöveg, gomb; cél URL-ek beillesztése (főoldal, bolt, kategória, termék).
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">Weboldal beállítások</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Nem oldal-specifikus — az egész sablonra érvényes ({template.manifest.name}).
            </p>
          </div>
          <Link
            href="/admin/templates"
            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            Sablonok kezelése →
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cmsSettingsSections.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/cms/settings?section=${item.id}`}
                className="block h-full rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-4 transition hover:border-violet-400/40 hover:bg-violet-500/10"
              >
                <span className="text-sm font-bold uppercase tracking-widest text-violet-100">
                  {item.label}
                </span>
                <span className="mt-2 block text-xs font-normal normal-case tracking-normal text-neutral-400">
                  {item.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 pt-4 border-t border-white/10">
        <h2 className="text-lg font-black uppercase tracking-wider text-white">Oldalak szerkesztése</h2>
        <p className="text-xs text-neutral-500">
          Válassz egy oldalt a vizuális szerkesztőhöz. A főoldal blokkos CMS; a többi oldal sablon JSON
          felületet használ.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <li key={p.adminSegment}>
              <Link
                href={`/admin/cms/${p.adminSegment}`}
                className="block rounded-lg border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold uppercase tracking-widest text-white transition hover:border-white/30 hover:bg-white/10"
              >
                {p.label}
                <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-neutral-500">
                  {p.pageKey} · {p.category}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
