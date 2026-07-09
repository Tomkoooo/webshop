import { ShopTradingSettingsService } from "@wse/core/services/shop-trading-settings"
import { ShopTradingAdminForm } from "@wse/core/components/admin/ShopTradingAdminForm"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"

export default async function AdminShopTradingPage() {
  const initial = await ShopTradingSettingsService.get()

  return (
    <AdminPageScaffold
      title="Ország és kereskedés"
      description="Szállítási és számlázási országkorlátok (ISO2). A pénztár és a backend ugyanezt a listát érvényesíti. Üres lista = nincs korlátozás az adott típusnál."
    >
      <ShopTradingAdminForm initial={initial} />
    </AdminPageScaffold>
  )
}
