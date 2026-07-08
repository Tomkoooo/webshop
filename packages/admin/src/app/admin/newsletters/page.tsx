import { Send } from "lucide-react";
import {
  createNewsletterCampaign,
  getAdminNewsletters,
  sendNewsletterCampaign,
} from "@wse/core/actions/admin-newsletters";
import { Button } from "@wse/core/components/ui/button";
import { cn } from "@wse/core/lib/utils";
import { NewsletterCampaignForm } from "@wse/core/components/admin/NewsletterCampaignForm";

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

function StatusPill({ status }: { status: CampaignRow["status"] }) {
  return (
    <span
      className={cn(
        "px-2 py-1 text-[10px] uppercase tracking-widest font-black border",
        status === "draft" && "text-neutral-300 border-white/20 bg-white/5",
        status === "sending" && "text-amber-300 border-amber-300/40 bg-amber-500/10",
        status === "sent" && "text-emerald-400 border-emerald-400/40 bg-emerald-500/10",
        status === "failed" && "text-rose-400 border-rose-400/40 bg-rose-500/10"
      )}
    >
      {status}
    </span>
  );
}

export default async function AdminNewslettersPage() {
  const { isEnabled, campaigns, subscribers } = (await getAdminNewsletters()) as {
    isEnabled: boolean;
    campaigns: CampaignRow[];
    subscribers: SubscriberRow[];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
          Hírlevelek <span className="admin-headline-accent">Kampányok</span>
        </h1>
        <p className="text-white/40 font-medium italic">
          Kampány készítése és kiküldése vásárlóknak.
        </p>
      </div>

      {!isEnabled ? (
        <div className="bg-amber-500/10 border border-amber-300/30 p-6 text-amber-200">
          A hírlevél funkció jelenleg ki van kapcsolva. Kapcsold be az admin beállításoknál.
        </div>
      ) : (
        <NewsletterCampaignForm action={createNewsletterCampaign} />
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Kampány lista</h2>
        {campaigns.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-8 text-white/30 italic">
            Még nincs létrehozott kampány.
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign._id} className="bg-white/5 border border-white/10 p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-black uppercase tracking-wider text-white">{campaign.title}</h3>
                    <StatusPill status={campaign.status} />
                  </div>
                  <p className="text-neutral-400 font-bold">{campaign.subject}</p>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-black">
                    audience: {campaign.audience} · topic: {campaign.topic}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Létrehozva: {new Date(campaign.createdAt).toLocaleString("hu-HU")}
                    {campaign.sentAt ? ` · Kiküldve: ${new Date(campaign.sentAt).toLocaleString("hu-HU")}` : ""}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Címzettek: {campaign.recipientsCount} · Sikeres: {campaign.successCount} · Sikertelen: {campaign.failureCount}
                  </p>
                  {campaign.errorMessage ? (
                    <p className="text-[11px] text-rose-400">{campaign.errorMessage}</p>
                  ) : null}
                </div>
                <div>
                  <form action={sendNewsletterCampaign.bind(null, campaign._id)} className="inline-block">
                    <Button
                      type="submit"
                      className="h-11 rounded-none bg-emerald-700 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-[10px]"
                      disabled={!isEnabled || campaign.status === "sending"}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Küldés
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">
          Feliratkozott tagok ({subscribers.length})
        </h2>
        {subscribers.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-8 text-white/30 italic">
            Jelenleg nincs feliratkozott felhasználó.
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500 font-black">Név</th>
                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500 font-black">Email</th>
                  <th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-neutral-500 font-black">Feliratkozás dátuma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 text-white font-bold">
                      {subscriber.name || "Névtelen"}
                    </td>
                    <td className="px-5 py-4 text-neutral-300">{subscriber.email}</td>
                    <td className="px-5 py-4 text-neutral-400">
                      {subscriber.newsletterSubscribedAt
                        ? new Date(subscriber.newsletterSubscribedAt).toLocaleString("hu-HU")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
