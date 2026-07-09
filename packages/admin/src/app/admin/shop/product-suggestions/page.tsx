import { CategoryService } from "@wse/core/services/category"
import { ProductSuggestionSettingsService } from "@wse/core/services/product-suggestion-settings"
import { ProductSuggestionsAdminForm } from "@wse/core/components/admin/ProductSuggestionsAdminForm"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"

function flattenCategories(nodes: any[], depth = 0): { id: string; name: string; depth: number }[] {
  return nodes.reduce((acc: { id: string; name: string; depth: number }[], node: any) => {
    acc.push({ id: node._id.toString(), name: node.name, depth })
    if (node.children?.length) {
      acc.push(...flattenCategories(node.children, depth + 1))
    }
    return acc
  }, [])
}

export default async function AdminProductSuggestionsPage() {
  const [settings, tree] = await Promise.all([
    ProductSuggestionSettingsService.get(),
    CategoryService.getTree(),
  ])
  const categories = flattenCategories(tree)

  return (
    <AdminPageScaffold
      title="Termék javaslatok"
      description="Kosár → pénztár gombnál megjelenő javasolt termékek. Nettó árszűrő a katalógus szűrével egyezik; termékek bruttó javaslatánál a termék saját ÁFA kulcsát használjuk."
    >
      <ProductSuggestionsAdminForm initial={settings} categories={categories} />
    </AdminPageScaffold>
  )
}
