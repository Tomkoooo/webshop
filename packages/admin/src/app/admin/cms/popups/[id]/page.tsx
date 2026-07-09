import { notFound } from "next/navigation"
import { PopupCampaignService } from "@wse/core/services/popup-campaign"
import { PopupCampaignForm } from "@wse/core/components/admin/PopupCampaignForm"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

export default async function AdminPopupCampaignEditPage({ params }: Props) {
  const { id } = await params
  const campaign = await PopupCampaignService.getById(id)
  if (!campaign) notFound()

  return (
    <AdminPageScaffold
      backHref="/admin/cms/popups"
      backLabel="Popup bannerek"
      title={campaign.name}
    >
      <PopupCampaignForm campaign={campaign} />
    </AdminPageScaffold>
  )
}
