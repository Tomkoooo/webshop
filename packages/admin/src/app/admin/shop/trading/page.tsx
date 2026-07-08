import { ShopTradingSettingsService } from "@wse/core/services/shop-trading-settings"
import { ShopTradingAdminForm } from "@wse/core/components/admin/ShopTradingAdminForm"

export default async function AdminShopTradingPage() {
  const initial = await ShopTradingSettingsService.get()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="mb-2 font-heading text-4xl font-black uppercase italic leading-[0.9] tracking-tight text-white md:text-5xl">
          ORSZÁG &amp;{" "}
          <span className="admin-headline-accent">KERESKEDÉS</span>
        </h1>
        <p className="max-w-2xl text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Szállítási és számlázási országkorlátok (ISO2). A pénztár és a backend ugyanezt a listát érvényesíti. Üres lista =
          nincs korlátozás az adott típusnál.
        </p>
      </div>

      <ShopTradingAdminForm initial={initial} />
    </div>
  )
}
