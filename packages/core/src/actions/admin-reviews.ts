"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@wse/core/lib/db";
import Review from "@wse/core/models/Review";
import ShopFeedback from "@wse/core/models/ShopFeedback";
import { requireAdmin } from "@wse/core/lib/admin-auth";
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags";

type ReviewStatus = "pending" | "approved" | "rejected";

function normalizeStatus(value: string): ReviewStatus {
  if (value === "approved" || value === "rejected" || value === "pending") {
    return value;
  }
  return "pending";
}

export async function getAdminReviews() {
  await requireAdmin();
  await dbConnect();

  const [productReviews, shopFeedbacks] = await Promise.all([
    Review.find({})
      .populate("user", "name email")
      .populate("product", "name slug")
      .sort({ createdAt: -1 })
      .lean(),
    ShopFeedback.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    productReviews: JSON.parse(JSON.stringify(productReviews)),
    shopFeedbacks: JSON.parse(JSON.stringify(shopFeedbacks)),
  };
}

export async function updateProductReviewStatus(reviewId: string, status: string) {
  await requireAdmin();
  await dbConnect();

  await Review.findByIdAndUpdate(reviewId, { status: normalizeStatus(status) });

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.homepage);
}

export async function updateShopFeedbackStatus(feedbackId: string, status: string) {
  await requireAdmin();
  await dbConnect();

  await ShopFeedback.findByIdAndUpdate(feedbackId, { status: normalizeStatus(status) });

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.homepage);
}

export async function deleteProductReview(reviewId: string) {
  await requireAdmin();
  await dbConnect();

  await Review.findByIdAndDelete(reviewId);
  revalidatePath("/admin/reviews");
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.homepage);
}

export async function deleteShopFeedback(feedbackId: string) {
  await requireAdmin();
  await dbConnect();

  await ShopFeedback.findByIdAndDelete(feedbackId);
  revalidatePath("/admin/reviews");
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.homepage);
}
