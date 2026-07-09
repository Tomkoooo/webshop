import Link from "next/link"
import { PopupCampaignService } from "@wse/core/services/popup-campaign"
import {
  PopupCampaignCreateButton,
  PopupCampaignDeleteButton,
  PopupCampaignEditLink,
} from "@wse/core/components/admin/PopupCampaignListActions"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { Badge } from "@wse/core/components/ui/badge"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { cn } from "@wse/core/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminPopupCampaignsPage() {
  const campaigns = await PopupCampaignService.list()

  return (
    <AdminPageScaffold
      title="Popup bannerek"
      description="Webshop szintű modális kampányok képpel, szöveggel és gombbal. Cél URL-eket beilleszthetsz a böngészőből (főoldal, bolt, kategória, termék)."
      backHref="/admin/cms"
      backLabel="CMS áttekintés"
      actions={<PopupCampaignCreateButton />}
    >
      {campaigns.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Még nincs popup kampány. Hozz létre egyet az „Új popup” gombbal.
        </p>
      ) : (
        <ul className="grid gap-3">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Card className="py-0 shadow-sm">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link href={`/admin/cms/popups/${c.id}`} className="min-w-0 flex-1 hover:opacity-90">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-foreground">{c.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          c.enabled
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
                            : "text-muted-foreground"
                        )}
                      >
                        {c.enabled ? "Aktív" : "Inaktív"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Prioritás {c.priority} · {c.targetPaths.length} URL · sablon: {c.templateId}
                    </p>
                    <p className="text-muted-foreground mt-1 truncate font-mono text-xs">
                      {c.targetPaths.join(", ")}
                    </p>
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <PopupCampaignEditLink id={c.id} />
                    <PopupCampaignDeleteButton id={c.id} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AdminPageScaffold>
  )
}
