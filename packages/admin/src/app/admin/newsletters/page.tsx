import { Send } from "lucide-react";
import {
  createNewsletterCampaign,
  getAdminNewsletters,
  sendNewsletterCampaign,
} from "@wse/core/actions/admin-newsletters";
import { Button } from "@wse/core/components/ui/button";
import { Card, CardContent } from "@wse/core/components/ui/card";
import { NewsletterCampaignForm } from "@wse/core/components/admin/NewsletterCampaignForm";
import { AdminPageScaffold, AdminSection } from "@wse/core/components/admin/AdminPageScaffold";
import { AdminDataTable } from "@wse/core/components/admin/AdminDataTable";
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge";

type CampaignRow = {
  _id: string;
  title: string;
  subject: string;
  audience: "all_users" | "customers";
  topic: "general" | "discounts" | "coupons" | "new_products";
  status: "draft" | "sending" | "sent" | "failed";
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  errorMessage?: string;
  createdAt: string | Date;
  sentAt?: string | Date;
};

type SubscriberRow = {
  _id: string;
  name?: string;
  email: string;
  newsletterSubscribedAt?: string | Date;
};

const campaignStatusLabels: Record<CampaignRow["status"], string> = {
  draft: "Piszkozat",
  sending: "Küldés folyamatban",
  sent: "Elküldve",
  failed: "Sikertelen",
};

export default async function AdminNewslettersPage() {
  const { isEnabled, campaigns, subscribers } = (await getAdminNewsletters()) as {
    isEnabled: boolean;
    campaigns: CampaignRow[];
    subscribers: SubscriberRow[];
  };

  return (
    <AdminPageScaffold
      title="Hírlevelek"
      description="Kampány készítése és kiküldése vásárlóknak."
    >
      {!isEnabled ? (
        <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          A hírlevél funkció jelenleg ki van kapcsolva. Kapcsold be az admin beállításoknál.
        </div>
      ) : (
        <NewsletterCampaignForm action={createNewsletterCampaign} />
      )}

      <AdminSection title="Kampány lista">
        {campaigns.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              Még nincs létrehozott kampány.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign._id} className="shadow-sm">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold">{campaign.title}</h3>
                        <AdminStatusBadge
                          status={campaign.status}
                          label={campaignStatusLabels[campaign.status]}
                        />
                      </div>
                      <p className="font-medium text-muted-foreground">{campaign.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        Célcsoport: {campaign.audience} · Téma: {campaign.topic}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Létrehozva: {new Date(campaign.createdAt).toLocaleString("hu-HU")}
                        {campaign.sentAt ? ` · Kiküldve: ${new Date(campaign.sentAt).toLocaleString("hu-HU")}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Címzettek: {campaign.recipientsCount} · Sikeres: {campaign.successCount} · Sikertelen: {campaign.failureCount}
                      </p>
                      {campaign.errorMessage ? (
                        <p className="text-xs text-rose-600">{campaign.errorMessage}</p>
                      ) : null}
                    </div>
                    <form action={sendNewsletterCampaign.bind(null, campaign._id)} className="inline-block">
                      <Button
                        type="submit"
                        disabled={!isEnabled || campaign.status === "sending"}
                      >
                        <Send className="size-4" />
                        Küldés
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection title={`Feliratkozott tagok (${subscribers.length})`}>
        <AdminDataTable
          rows={subscribers}
          getRowKey={(subscriber) => subscriber._id}
          emptyMessage="Jelenleg nincs feliratkozott felhasználó."
          className="min-w-[640px]"
          columns={[
            {
              id: "name",
              header: "Név",
              cell: (subscriber) => (
                <span className="font-medium">{subscriber.name || "Névtelen"}</span>
              ),
            },
            {
              id: "email",
              header: "Email",
              cell: (subscriber) => subscriber.email,
            },
            {
              id: "subscribedAt",
              header: "Feliratkozás dátuma",
              cell: (subscriber) =>
                subscriber.newsletterSubscribedAt
                  ? new Date(subscriber.newsletterSubscribedAt).toLocaleString("hu-HU")
                  : "-",
            },
          ]}
        />
      </AdminSection>
    </AdminPageScaffold>
  );
}
