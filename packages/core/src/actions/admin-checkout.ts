"use server"

import dbConnect from "@wse/core/lib/db";
import ShippingMethod from "@wse/core/models/ShippingMethod";
import PaymentMethod from "@wse/core/models/PaymentMethod";
import Coupon from "@wse/core/models/Coupon";
import Product from "@wse/core/models/Product";
import { normalizeCouponPayload } from "@wse/core/lib/coupon-validation";
import { getActiveVariants, getVariantLabel } from "@wse/core/lib/product-variants";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@wse/core/lib/admin-auth";

// Shipping Methods
export async function createShippingMethod(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const grossPrice = parseFloat(formData.get("grossPrice") as string);
  const isActive = formData.get("isActive") === "true";
  const providerRaw = (formData.get("provider") as string) || "standard";
  const provider =
    providerRaw === "gls" || providerRaw === "foxpost" ? providerRaw : "standard";
  const descriptionHtml = String(formData.get("descriptionHtml") || "").trim();

  try {
    await dbConnect();
    await ShippingMethod.create({ name, grossPrice, isActive, provider, descriptionHtml });
  } catch (error) {
    console.error("Error creating shipping method:", error);
  }
  revalidatePath("/admin/shipping");
}

export async function updateShippingMethod(id: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const grossPrice = parseFloat(formData.get("grossPrice") as string);
  const isActive = formData.get("isActive") === "true";
  const providerRaw = (formData.get("provider") as string) || "standard";
  const provider =
    providerRaw === "gls" || providerRaw === "foxpost" ? providerRaw : "standard";
  const descriptionHtml = String(formData.get("descriptionHtml") || "").trim();

  try {
    await dbConnect();
    await ShippingMethod.findByIdAndUpdate(id, { name, grossPrice, isActive, provider, descriptionHtml });
  } catch (error) {
    console.error("Error updating shipping method:", error);
  }
  revalidatePath("/admin/shipping");
}

export async function deleteShippingMethod(id: string) {
  await requireAdmin();

  try {
    await dbConnect();
    await ShippingMethod.findByIdAndDelete(id);
  } catch (error) {
    console.error("Error deleting shipping method:", error);
  }
  revalidatePath("/admin/shipping");
}

// Payment Methods
export async function createPaymentMethod(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const grossPrice = parseFloat(formData.get("grossPrice") as string);
  const isActive = formData.get("isActive") === "true";

  try {
    await dbConnect();
    await PaymentMethod.create({ name, grossPrice, isActive });
  } catch (error) {
    console.error("Error creating payment method:", error);
  }
  revalidatePath("/admin/payment");
}

export async function updatePaymentMethod(id: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const grossPrice = parseFloat(formData.get("grossPrice") as string);
  const isActive = formData.get("isActive") === "true";

  try {
    await dbConnect();
    await PaymentMethod.findByIdAndUpdate(id, { name, grossPrice, isActive });
  } catch (error) {
    console.error("Error updating payment method:", error);
  }
  revalidatePath("/admin/payment");
}

export async function deletePaymentMethod(id: string) {
  await requireAdmin();

  try {
    await dbConnect();
    await PaymentMethod.findByIdAndDelete(id);
  } catch (error) {
    console.error("Error deleting payment method:", error);
  }
  revalidatePath("/admin/payment");
}

// Coupons
export async function createCoupon(data: any) {
  await requireAdmin();

  try {
    await dbConnect();
    const payload = normalizeCouponPayload(data);
    const existing = await Coupon.findOne({ code: payload.code });
    if (existing) {
      throw new Error("Ez a kuponkód már létezik");
    }
    await Coupon.create(payload);
  } catch (error) {
    console.error("Error creating coupon:", error);
    throw error;
  }
  revalidatePath("/admin/coupons");
}

export async function updateCoupon(id: string, data: any) {
  await requireAdmin();

  if (!id?.trim()) {
    throw new Error("Érvénytelen kupon azonosító");
  }

  try {
    await dbConnect();
    const payload = normalizeCouponPayload(data);
    const existing = await Coupon.findOne({ code: payload.code, _id: { $ne: id } });
    if (existing) {
      throw new Error("Ez a kuponkód már létezik");
    }

    const updated = await Coupon.findByIdAndUpdate(
      id,
      {
        $set: {
          code: payload.code,
          type: payload.type,
          value: payload.value,
          minCartValue: payload.minCartValue,
          startDate: payload.startDate,
          endDate: payload.endDate,
          maxUses: payload.maxUses,
          maxUsesPerUser: payload.maxUsesPerUser,
          isActive: payload.isActive,
          productPriceRules: payload.productPriceRules ?? [],
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new Error("Kupon nem található");
    }
  } catch (error) {
    console.error("Error updating coupon:", error);
    throw error;
  }
  revalidatePath("/admin/coupons");
}

export async function getProductForCouponRule(productId: string) {
  await requireAdmin();
  await dbConnect();

  const product = await Product.findById(productId)
    .select("name variants requireVariantSelection")
    .lean();
  if (!product) return null;

  const variants = getActiveVariants(product as never).map((variant) => ({
    id: variant.id,
    label: getVariantLabel(variant),
  }));

  return {
    id: product._id.toString(),
    name: product.name,
    requiresVariant: Boolean(product.requireVariantSelection) && variants.length > 0,
    variants,
  };
}

export async function deleteCoupon(id: string) {
  await requireAdmin();

  try {
    await dbConnect();
    await Coupon.findByIdAndDelete(id);
  } catch (error) {
    console.error("Error deleting coupon:", error);
  }
  revalidatePath("/admin/coupons");
}
