import { CategoryService } from "@wse/core/services/category";
import { notFound } from "next/navigation";
import CategoryForm from "../CategoryForm";

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await CategoryService.getById(id);
  const categories = await CategoryService.getAll();

  if (!category) return notFound();

  return <CategoryForm categories={categories} initialData={category} isEdit />;
}
