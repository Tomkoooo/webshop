import { CategoryService } from "@wse/core/services/category"
import { ProductSuggestionSettingsService } from "@wse/core/services/product-suggestion-settings"
import { ProductSuggestionsAdminForm } from "@wse/core/components/admin/ProductSuggestionsAdminForm"

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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
          TERMÉK <span className="admin-headline-accent">JAVASLATOK</span>
        </h1>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] max-w-2xl">
          Kosár → pénztár gombnál megjelenő javasolt termékek. Nettó árszűrő a katalógus szűrével egyezik; termékek bruttó javaslatánál a termék saját ÁFA kulcsát használjuk.
        </p>
      </div>

      <ProductSuggestionsAdminForm initial={settings} categories={categories} />
    </div>
  )
}
