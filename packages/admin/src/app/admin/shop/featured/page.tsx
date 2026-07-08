import { ShopFeaturedSettingsService } from "@wse/core/services/shop-featured-settings"
import { CategoryService } from "@wse/core/services/category"
import { ShopFeaturedAdminForm } from "@wse/core/components/admin/ShopFeaturedAdminForm"

export default async function AdminShopFeaturedPage() {
  const [initial, categories] = await Promise.all([
    ShopFeaturedSettingsService.get(),
    CategoryService.getAll(),
  ])

  const categoryOptions = categories.map((c: { _id: { toString(): string }; name: string }) => ({
    id: c._id.toString(),
    name: c.name,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-black italic uppercase tracking-tight text-white">
          Kiemelt <span className="admin-text-accent">termékek</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-400">
          A főoldal kiemelt termék szekciójának sorrendje. A CMS-ben kiválasztott terméklista felülírja ezeket a
          beállításokat. Termék- és kategória szinten a „lista index” mező finomhangolja a sorrendet.
        </p>
      </div>
      <ShopFeaturedAdminForm initial={initial} categories={categoryOptions} />
    </div>
  )
}
