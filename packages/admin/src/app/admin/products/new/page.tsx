import { CategoryService } from "@wse/core/services/category"
import ProductForm from "./ProductForm"

export default async function NewProductPage() {
  const categories = await CategoryService.getAll()
  
  return <ProductForm categories={categories} />
}
