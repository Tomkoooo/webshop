"use server"

import { CategoryService } from "@wse/core/services/category";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@wse/core/lib/utils";
import { requireAdmin } from "@wse/core/lib/admin-auth";

function parseFeaturedListIndex(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = Math.round(Number(text));
  return Number.isFinite(n) ? n : null;
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const parent = formData.get("parent") as string || null;
  const image = formData.get("image") as string || "";
  const slug = slugify(name);

  const seo = {
    title: formData.get("seo_title") as string || name,
    description: formData.get("seo_description") as string || "",
    keywords: (formData.get("seo_keywords") as string || "").split(",").map(k => k.trim()),
  };
  const featuredListIndex = parseFeaturedListIndex(formData.get("featuredListIndex"));

  try {
    await CategoryService.create({
      name,
      parent: parent as any,
      image,
      slug,
      seo,
      featuredListIndex,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const parent = formData.get("parent") as string || null;
  const image = formData.get("image") as string || "";

  const seo = {
    title: formData.get("seo_title") as string || name,
    description: formData.get("seo_description") as string || "",
    keywords: (formData.get("seo_keywords") as string || "").split(",").map(k => k.trim()),
  };
  const featuredListIndex = parseFeaturedListIndex(formData.get("featuredListIndex"));

  try {
    await CategoryService.update(id, {
      name,
      slug: slugify(name),
      parent: parent as any,
      image,
      seo,
      featuredListIndex,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  try {
    await CategoryService.delete(id);
  } catch (error) {
    console.error("Error deleting category:", error);
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

