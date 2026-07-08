"use server";

import nodemailer from "nodemailer";
import { revalidatePath } from "next/cache";
import dbConnect from "@wse/core/lib/db";
import User from "@wse/core/models/User";
import Order from "@wse/core/models/Order";
import NewsletterCampaign, {
  NewsletterAudience,
  NewsletterTopic,
} from "@wse/core/models/NewsletterCampaign";
import { requireAdmin } from "@wse/core/lib/admin-auth";
import { formatEmailFromHeader } from "@wse/core/lib/email-from";
import FeatureFlag from "@wse/core/models/FeatureFlag";

type Recipient = {
  id: string;
  email: string;
  name?: string;
  subscribedAt?: Date;
};

const subscribedFilter = {
  $or: [
    { newsletterSubscribed: true },
    {
      newsletterSubscribedAt: { $exists: true },
      $or: [
        { newsletterUnsubscribedAt: { $exists: false } },
        { newsletterUnsubscribedAt: null },
      ],
    },
  ],
};

function normalizeAudience(input: string): NewsletterAudience {
  return input === "customers" ? "customers" : "all_users";
}

function normalizeTopic(input: string): NewsletterTopic {
  if (input === "discounts" || input === "coupons" || input === "new_products") {
    return input;
  }
  return "general";
}

async function getTransporter() {
  const user = process.env.EMAIL_USER || "test@example.com";
  const pass = process.env.EMAIL_PASS || "password";
  const host = process.env.EMAIL_HOST || "smtp.example.com";
  const port = parseInt(process.env.EMAIL_PORT || "587");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function getRecipients(audience: NewsletterAudience): Promise<Recipient[]> {
  if (audience === "all_users") {
    const users = await User.find({
      email: { $exists: true, $ne: null },
      ...subscribedFilter,
    })
      .select("_id email name newsletterSubscribedAt")
      .lean();

    return users
      .filter((user) => typeof user.email === "string" && user.email.length > 0)
      .map((user) => ({
        id: user._id.toString(),
        email: String(user.email),
        name: typeof user.name === "string" ? user.name : undefined,
        subscribedAt: user.newsletterSubscribedAt,
      }));
  }

  const customerIdsRaw = await Order.distinct("user", {
    user: { $exists: true, $ne: null },
    status: { $ne: "cancelled" },
  });

  const customerIds = customerIdsRaw.filter(Boolean);
  const users = await User.find({
    _id: { $in: customerIds },
    email: { $exists: true, $ne: null },
    ...subscribedFilter,
  })
    .select("_id email name newsletterSubscribedAt")
    .lean();

  return users
    .filter((user) => typeof user.email === "string" && user.email.length > 0)
    .map((user) => ({
      id: user._id.toString(),
      email: String(user.email),
      name: typeof user.name === "string" ? user.name : undefined,
      subscribedAt: user.newsletterSubscribedAt,
    }));
}

export async function getAdminNewsletters() {
  await requireAdmin();
  await dbConnect();

  const newsletterFlag = await FeatureFlag.findOne({ key: "newsletter" }).lean();
  const isEnabled = Boolean(newsletterFlag?.enabled);

  const campaigns = await NewsletterCampaign.find({})
    .sort({ createdAt: -1 })
    .lean();

  const subscribers = await User.find({
    email: { $exists: true, $ne: null },
    ...subscribedFilter,
  })
    .select("_id name email newsletterSubscribedAt")
    .sort({ newsletterSubscribedAt: -1, createdAt: -1 })
    .lean();

  return {
    isEnabled,
    campaigns: JSON.parse(JSON.stringify(campaigns)),
    subscribers: JSON.parse(JSON.stringify(subscribers)),
  };
}

export async function createNewsletterCampaign(formData: FormData) {
  const session = await requireAdmin();
  await dbConnect();

  const title = String(formData.get("title") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const bodyHtml = String(formData.get("bodyHtml") || "").trim();
  const audience = normalizeAudience(String(formData.get("audience") || "all_users"));
  const topic = normalizeTopic(String(formData.get("topic") || "general"));

  if (!title || !subject || !bodyHtml) {
    throw new Error("A cím, tárgy és tartalom kötelező.");
  }

  await NewsletterCampaign.create({
    title,
    subject,
    bodyHtml,
    audience,
    topic,
    status: "draft",
    createdBy: session.user.id,
  });

  revalidatePath("/admin/newsletters");
}

export async function sendNewsletterCampaign(campaignId: string) {
  await requireAdmin();
  await dbConnect();

  const campaign = await NewsletterCampaign.findById(campaignId);
  if (!campaign) {
    throw new Error("A kampány nem található.");
  }

  const newsletterFlag = await FeatureFlag.findOne({ key: "newsletter" }).lean();
  if (!newsletterFlag?.enabled) {
    throw new Error("A hírlevél funkció ki van kapcsolva.");
  }

  campaign.status = "sending";
  campaign.errorMessage = undefined;
  await campaign.save();

  try {
    const recipients = await getRecipients(campaign.audience);
    const transporter = await getTransporter();
    const from = formatEmailFromHeader();

    let successCount = 0;
    let failureCount = 0;

    for (const recipient of recipients) {
      try {
        const unsubscribeUrl = "https://krauszbarkacs.hu/profile";

        const personalizedBody = campaign.bodyHtml.replace(
          /\{\{\s*name\s*\}\}/g,
          recipient.name || "Vásárló"
        );
        const personalizedHtml = `
          ${personalizedBody}
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
          <p style="font-size:12px;color:#6b7280;">
            Ezt az üzenetet azért kaptad, mert feliratkoztál a hírlevelünkre.
            <br />
            <a href="${unsubscribeUrl}" style="color:#FF5500;">Leiratkozás</a>
          </p>
        `;

        await transporter.sendMail({
          from,
          to: recipient.email,
          subject: campaign.subject,
          html: personalizedHtml,
        });
        successCount += 1;
      } catch {
        failureCount += 1;
      }
    }

    campaign.status = failureCount === 0 ? "sent" : "failed";
    campaign.sentAt = new Date();
    campaign.recipientsCount = recipients.length;
    campaign.successCount = successCount;
    campaign.failureCount = failureCount;
    campaign.errorMessage =
      failureCount > 0 ? `${failureCount} címre nem sikerült kézbesíteni.` : undefined;
    await campaign.save();
  } catch (error) {
    campaign.status = "failed";
    campaign.errorMessage =
      error instanceof Error ? error.message : "Ismeretlen hiba történt küldés közben.";
    await campaign.save();
    throw error;
  } finally {
    revalidatePath("/admin/newsletters");
  }
}
