import { Star, CheckCircle2, Clock3, XCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  deleteProductReview,
  deleteShopFeedback,
  getAdminReviews,
  updateProductReviewStatus,
  updateShopFeedbackStatus,
} from "@wse/core/actions/admin-reviews";
import { Button } from "@wse/core/components/ui/button";
import { Card, CardContent } from "@wse/core/components/ui/card";
import { cn } from "@wse/core/lib/utils";
import { AdminPageScaffold, AdminSection } from "@wse/core/components/admin/AdminPageScaffold";
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge";

type ReviewStatus = "pending" | "approved" | "rejected";

type ProductReviewRow = {
  _id: string;
  status?: ReviewStatus;
  rating: number;
  description: string;
  createdAt: string | Date;
  user?: { name?: string; email?: string };
  product?: { name?: string; slug?: string };
};

type ShopFeedbackRow = {
  _id: string;
  status?: ReviewStatus;
  rating: number;
  comment?: string;
  createdAt: string | Date;
  user?: { name?: string; email?: string };
};

const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: "Függőben",
  approved: "Jóváhagyva",
  rejected: "Elutasítva",
};

function ReviewStatusBadge({ status }: { status?: string }) {
  const safeStatus = (status || "pending") as ReviewStatus;
  return (
    <span className="inline-flex items-center gap-1">
      {safeStatus === "approved" && <CheckCircle2 className="size-3.5" />}
      {safeStatus === "rejected" && <XCircle className="size-3.5" />}
      {safeStatus === "pending" && <Clock3 className="size-3.5" />}
      <AdminStatusBadge status={safeStatus} label={reviewStatusLabels[safeStatus]} />
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn("size-4", star <= rating ? "fill-accent text-highlight" : "text-muted-foreground/30")}
        />
      ))}
    </div>
  );
}

export default async function AdminReviewsPage() {
  const { productReviews, shopFeedbacks } = await getAdminReviews() as {
    productReviews: ProductReviewRow[];
    shopFeedbacks: ShopFeedbackRow[];
  };

  return (
    <AdminPageScaffold
      title="Vélemények"
      description="Termékértékelések és bolti visszajelzések moderálása egy helyen."
    >
      <AdminSection title="Termékértékelések">
        {productReviews.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              Még nem érkezett termékértékelés.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {productReviews.map((review) => (
              <Card key={review._id} className="shadow-sm">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold">
                          {review.product?.name || "Törölt termék"}
                        </h3>
                        {review.product?.slug && (
                          <Link href={`/products/${review.product.slug}`} className="text-xs text-primary hover:underline">
                            Termékoldal
                          </Link>
                        )}
                        <ReviewStatusBadge status={review.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {review.user?.name || "Ismeretlen"} · {review.user?.email || "Nincs email"} ·{" "}
                        {new Date(review.createdAt).toLocaleDateString("hu-HU")}
                      </div>
                      <Stars rating={review.rating} />
                      <p className="text-foreground">&ldquo;{review.description}&rdquo;</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <form action={updateProductReviewStatus.bind(null, review._id.toString(), "approved")}>
                        <Button size="sm">Jóváhagyás</Button>
                      </form>
                      <form action={updateProductReviewStatus.bind(null, review._id.toString(), "pending")}>
                        <Button size="sm" variant="outline">Függőben</Button>
                      </form>
                      <form action={updateProductReviewStatus.bind(null, review._id.toString(), "rejected")}>
                        <Button size="sm" variant="destructive">Elutasítás</Button>
                      </form>
                      <form action={deleteProductReview.bind(null, review._id.toString())}>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-rose-600">
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection title="Boltértékelések">
        {shopFeedbacks.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              Még nem érkezett boltértékelés.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {shopFeedbacks.map((feedback) => (
              <Card key={feedback._id} className="shadow-sm">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">Webshop visszajelzés</h3>
                        <ReviewStatusBadge status={feedback.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {feedback.user?.name || "Ismeretlen"} · {feedback.user?.email || "Nincs email"} ·{" "}
                        {new Date(feedback.createdAt).toLocaleDateString("hu-HU")}
                      </div>
                      <Stars rating={feedback.rating} />
                      <p className="text-foreground">
                        &ldquo;{feedback.comment || "Nincs szöveges megjegyzés."}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <form action={updateShopFeedbackStatus.bind(null, feedback._id.toString(), "approved")}>
                        <Button size="sm">Jóváhagyás</Button>
                      </form>
                      <form action={updateShopFeedbackStatus.bind(null, feedback._id.toString(), "pending")}>
                        <Button size="sm" variant="outline">Függőben</Button>
                      </form>
                      <form action={updateShopFeedbackStatus.bind(null, feedback._id.toString(), "rejected")}>
                        <Button size="sm" variant="destructive">Elutasítás</Button>
                      </form>
                      <form action={deleteShopFeedback.bind(null, feedback._id.toString())}>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-rose-600">
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AdminSection>
    </AdminPageScaffold>
  );
}
