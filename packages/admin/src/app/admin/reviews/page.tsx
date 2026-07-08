import { MessageSquare, Star, CheckCircle2, Clock3, XCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  deleteProductReview,
  deleteShopFeedback,
  getAdminReviews,
  updateProductReviewStatus,
  updateShopFeedbackStatus,
} from "@wse/core/actions/admin-reviews";
import { Button } from "@wse/core/components/ui/button";
import { cn } from "@wse/core/lib/utils";

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

function StatusBadge({ status }: { status?: string }) {
  const safeStatus = status || "pending";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] border",
        safeStatus === "approved" && "text-emerald-400 border-emerald-400/40 bg-emerald-500/10",
        safeStatus === "rejected" && "text-rose-400 border-rose-400/40 bg-rose-500/10",
        safeStatus === "pending" && "text-amber-300 border-amber-300/40 bg-amber-500/10"
      )}
    >
      {safeStatus === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
      {safeStatus === "rejected" && <XCircle className="w-3.5 h-3.5" />}
      {safeStatus === "pending" && <Clock3 className="w-3.5 h-3.5" />}
      {safeStatus}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn("w-4 h-4", star <= rating ? "fill-accent text-highlight" : "text-white/10")}
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
          Vélemények <span className="admin-headline-accent">Kezelése</span>
        </h1>
        <p className="text-white/40 font-medium italic">
          Termékértékelések és bolti visszajelzések moderálása egy helyen.
        </p>
      </div>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 admin-icon-accent" />
          <h2 className="text-xl font-black uppercase tracking-wider">Termékértékelések</h2>
        </div>

        <div className="space-y-4">
          {productReviews.length === 0 ? (
            <div className="bg-white/5 border border-white/10 p-8 text-white/30 italic">
              Még nem érkezett termékértékelés.
            </div>
          ) : (
            productReviews.map((review) => (
              <div key={review._id} className="bg-white/5 border border-white/10 p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-black text-white uppercase tracking-wider">
                        {review.product?.name || "Törölt termék"}
                      </h3>
                      {review.product?.slug && (
                        <Link href={`/products/${review.product.slug}`} className="text-[10px] uppercase tracking-widest admin-link-accent">
                          termékoldal
                        </Link>
                      )}
                      <StatusBadge status={review.status} />
                    </div>
                    <div className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest">
                      {review.user?.name || "Ismeretlen"} · {review.user?.email || "Nincs email"} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString("hu-HU")}
                    </div>
                    <Stars rating={review.rating} />
                    <p className="text-neutral-300 italic">&ldquo;{review.description}&rdquo;</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <form action={updateProductReviewStatus.bind(null, review._id.toString(), "approved")}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none">
                        Jóváhagyás
                      </Button>
                    </form>
                    <form action={updateProductReviewStatus.bind(null, review._id.toString(), "pending")}>
                      <Button size="sm" variant="outline" className="rounded-none border-white/20 text-white hover:bg-white/5">
                        Függőben
                      </Button>
                    </form>
                    <form action={updateProductReviewStatus.bind(null, review._id.toString(), "rejected")}>
                      <Button size="sm" className="bg-rose-700 hover:bg-rose-800 text-white rounded-none">
                        Elutasítás
                      </Button>
                    </form>
                    <form action={deleteProductReview.bind(null, review._id.toString())}>
                      <Button size="sm" variant="ghost" className="rounded-none text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 admin-icon-accent" />
          <h2 className="text-xl font-black uppercase tracking-wider">Boltértékelések</h2>
        </div>

        <div className="space-y-4">
          {shopFeedbacks.length === 0 ? (
            <div className="bg-white/5 border border-white/10 p-8 text-white/30 italic">
              Még nem érkezett boltértékelés.
            </div>
          ) : (
            shopFeedbacks.map((feedback) => (
              <div key={feedback._id} className="bg-white/5 border border-white/10 p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-white uppercase tracking-wider">Webshop visszajelzés</h3>
                      <StatusBadge status={feedback.status} />
                    </div>
                    <div className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest">
                      {feedback.user?.name || "Ismeretlen"} · {feedback.user?.email || "Nincs email"} ·{" "}
                      {new Date(feedback.createdAt).toLocaleDateString("hu-HU")}
                    </div>
                    <Stars rating={feedback.rating} />
                    <p className="text-neutral-300 italic">
                      &ldquo;{feedback.comment || "Nincs szöveges megjegyzés."}&rdquo;
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <form action={updateShopFeedbackStatus.bind(null, feedback._id.toString(), "approved")}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none">
                        Jóváhagyás
                      </Button>
                    </form>
                    <form action={updateShopFeedbackStatus.bind(null, feedback._id.toString(), "pending")}>
                      <Button size="sm" variant="outline" className="rounded-none border-white/20 text-white hover:bg-white/5">
                        Függőben
                      </Button>
                    </form>
                    <form action={updateShopFeedbackStatus.bind(null, feedback._id.toString(), "rejected")}>
                      <Button size="sm" className="bg-rose-700 hover:bg-rose-800 text-white rounded-none">
                        Elutasítás
                      </Button>
                    </form>
                    <form action={deleteShopFeedback.bind(null, feedback._id.toString())}>
                      <Button size="sm" variant="ghost" className="rounded-none text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
