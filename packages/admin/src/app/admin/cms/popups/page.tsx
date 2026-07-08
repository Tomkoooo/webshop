import Link from "next/link"
import { PopupCampaignService } from "@wse/core/services/popup-campaign"
import {
  PopupCampaignCreateButton,
  PopupCampaignDeleteButton,
  PopupCampaignEditLink,
} from "@wse/core/components/admin/PopupCampaignListActions"
import { cn } from "@wse/core/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminPopupCampaignsPage() {
  const campaigns = await PopupCampaignService.list()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/cms"
            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            ← CMS
          </Link>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">
            Popup <span className="admin-text-accent">bannerek</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Webshop szintű modális kampányok képpel, szöveggel és gombbal. Cél URL-eket beilleszthetsz a
            böngészőből (főoldal, bolt, kategória, termék).
          </p>
        </div>
        <PopupCampaignCreateButton />
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-neutral-500">Még nincs popup kampány. Hozz létre egyet az „Új popup” gombbal.</p>
      ) : (
        <ul className="grid gap-3">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link href={`/admin/cms/popups/${c.id}`} className="min-w-0 flex-1 hover:opacity-90">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-widest text-white">{c.name}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                      c.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-500/10 text-neutral-500"
                    )}
                  >
                    {c.enabled ? "Aktív" : "Inaktív"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Prioritás {c.priority} · {c.targetPaths.length} URL · sablon: {c.templateId}
                </p>
                <p className="mt-1 truncate font-mono text-[10px] text-neutral-600">
                  {c.targetPaths.join(", ")}
                </p>
              </Link>
              <div className="flex shrink-0 gap-1">
                <PopupCampaignEditLink id={c.id} />
                <PopupCampaignDeleteButton id={c.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
