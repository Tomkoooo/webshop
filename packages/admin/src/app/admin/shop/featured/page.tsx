import { ShopFeaturedSettingsService } from "@wse/core/services/shop-featured-settings"
import { CategoryService } from "@wse/core/services/category"
import { ShopFeaturedAdminForm } from "@wse/core/components/admin/ShopFeaturedAdminForm"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"

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
    <AdminPageScaffold
      title="Kiemelt termékek"
      description="A főoldal kiemelt termék szekciójának sorrendje. A CMS-ben kiválasztott terméklista felülírja ezeket a beállításokat. Termék- és kategória szinten a „lista index” mező finomhangolja a sorrendet."
    >
      <ShopFeaturedAdminForm initial={initial} categories={categoryOptions} />
    </AdminPageScaffold>
  )
}
