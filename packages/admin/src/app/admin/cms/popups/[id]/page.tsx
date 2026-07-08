import Link from "next/link"
import { notFound } from "next/navigation"
import { PopupCampaignService } from "@wse/core/services/popup-campaign"
import { PopupCampaignForm } from "@wse/core/components/admin/PopupCampaignForm"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

export default async function AdminPopupCampaignEditPage({ params }: Props) {
  const { id } = await params
  const campaign = await PopupCampaignService.getById(id)
  if (!campaign) notFound()

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/cms/popups"
          className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
        >
          ← Popup bannerek
        </Link>
        <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">
          {campaign.name}
        </h1>
      </div>
      <PopupCampaignForm campaign={campaign} />
    </div>
  )
}
