import { CategoryService } from "@wse/core/services/category";
import CategoryForm from "../CategoryForm";

export default async function NewCategory() {
  const categories = await CategoryService.getAll();

  return <CategoryForm categories={categories} />;
}
