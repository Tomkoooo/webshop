import { ProductService, type ProductFilters } from "@wse/core/services/product";
import { Plus, Search as SearchIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@wse/core/components/ui/button";
import { Input } from "@wse/core/components/ui/input";
import { cn } from "@wse/core/lib/utils";
import { formatHuf, listingHasPriceRange, listingPriceSummary } from "@wse/core/lib/pricing";
import { FallbackImage } from "@wse/core/components/common/FallbackImage";
import { mediaImageSrc } from "@wse/core/lib/images";
import { ProductRowActions } from "./ProductRowActions";

type AdminProductVariant = {
  netPrice?: number;
  grossPrice?: number | null;
  discount?: number;
  stock?: number;
  isActive?: boolean;
};

type AdminProductListRow = {
  _id: string | { toString(): string };
  name: string;
  slug: string;
  images?: string[];
  isActive?: boolean;
  isVisible?: boolean;
  deletedAt?: string | Date | null;
  stock?: number;
  netPrice: number;
  grossPrice?: number | null;
  discount?: number;
  vatPercent?: number;
  requireVariantSelection?: boolean;
  variants?: AdminProductVariant[];
};

export default async function AdminProducts({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string; q?: string; active?: string; visible?: string; discounted?: string; deleted?: string }> 
}) {
  const { page, q, active, visible, discounted, deleted } = await searchParams;
  const currentPage = parseInt(page || "1");
  
  const filters: ProductFilters = { search: q };
  if (active === "true") filters.isActive = true;
  if (active === "false") filters.isActive = false;
  if (visible === "true") filters.isVisible = true;
  if (visible === "false") filters.isVisible = false;
  if (discounted === "true") filters.isDiscounted = true;
  if (deleted === "true") filters.deleted = true;

  const { products, total, pages } = await ProductService.getPaginated(currentPage, 10, filters);
  const listProducts = products as unknown as AdminProductListRow[];
  const currentParams = {
    ...(q ? { q } : {}),
    ...(active ? { active } : {}),
    ...(visible ? { visible } : {}),
    ...(discounted ? { discounted } : {}),
    ...(deleted ? { deleted } : {}),
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
            Termékek <span className="admin-headline-accent">Készlete</span>
          </h1>
          <p className="text-white/40 font-medium italic">Kezelje a bolt árukészletét, árait és kategóriáit.</p>
        </div>
        <Link href="/admin/products/new" className="w-full sm:w-auto">
          <Button variant="krausz" className="w-full sm:w-auto h-14 px-8 flex items-center gap-3">
            <Plus className="w-5 h-5" />
            ÚJ TERMÉK
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white/5 p-4 rounded-none border border-white/10">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-neutral-600" />
          <form method="GET">
            <Input 
              name="q"
              defaultValue={q}
              placeholder="KERESÉS..." 
              className="bg-black border-white/5 pl-12 h-12 text-white font-black uppercase tracking-widest text-xs focus-visible:ring-primary w-full rounded-none"
            />
          </form>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/products?${new URLSearchParams({ ...currentParams, active: active === 'true' ? '' : 'true' }).toString()}`}>
            <Button variant="ghost" size="sm" className={cn("h-12 rounded-none border-2 uppercase tracking-widest text-[10px] font-black px-4", active === 'true' ? "admin-item-selected" : "border-white/5 text-neutral-500 hover:text-white admin-item-idle")}>
              Aktív
            </Button>
          </Link>
          <Link href={`/admin/products?${new URLSearchParams({ ...currentParams, visible: visible === 'true' ? '' : 'true' }).toString()}`}>
            <Button variant="ghost" size="sm" className={cn("h-12 rounded-none border-2 uppercase tracking-widest text-[10px] font-black px-4", visible === 'true' ? "admin-item-selected" : "border-white/5 text-neutral-500 hover:text-white admin-item-idle")}>
              Látható
            </Button>
          </Link>
          <Link href={`/admin/products?${new URLSearchParams({ ...currentParams, discounted: discounted === 'true' ? '' : 'true' }).toString()}`}>
            <Button variant="ghost" size="sm" className={cn("h-12 rounded-none border-2 uppercase tracking-widest text-[10px] font-black px-4", discounted === 'true' ? "admin-item-selected" : "border-white/5 text-neutral-500 hover:text-white admin-item-idle")}>
              Akciós
            </Button>
          </Link>
          <Link href={`/admin/products?${new URLSearchParams({ ...currentParams, deleted: deleted === 'true' ? '' : 'true' }).toString()}`}>
            <Button variant="ghost" size="sm" className={cn("h-12 rounded-none border-2 uppercase tracking-widest text-[10px] font-black px-4", deleted === 'true' ? "border-rose-500/40 bg-rose-500/10 text-rose-300" : "border-white/5 text-neutral-500 hover:text-white admin-item-idle")}>
              Töröltek
            </Button>
          </Link>
          {Object.values(currentParams).some(v => v !== undefined && v !== "") && (
            <Link href="/admin/products">
              <Button variant="ghost" size="sm" className="h-12 px-4 text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 font-black uppercase tracking-widest text-[10px]">
                Visszaállít
              </Button>
            </Link>
          )}
        </div>

        <div className="hidden xl:block flex-1" />
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-2">
          Találat: <span className="text-white">{total}</span>
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-none overflow-hidden text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Termék</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Állapot</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Készlet</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Ár</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                    Nem található a keresésnek megfelelő termék.
                  </td>
                </tr>
              ) : (
                listProducts.map((product) => {
                    const productId = product._id.toString()
                    const isDeleted = Boolean(product.deletedAt)
                    const stock = Number(product.stock ?? 0)
                    const variants = Array.isArray(product.variants)
                      ? product.variants.filter((variant) => variant.isActive !== false)
                      : []
                    const hasVariants = variants.length > 0
                    const needsVariantSelection = Boolean(product.requireVariantSelection) && hasVariants
                    const priceLines = needsVariantSelection
                      ? variants.map((variant) => ({
                          netPrice: Number(variant.netPrice || product.netPrice) || product.netPrice,
                          discount: variant.discount,
                          grossPrice: variant.grossPrice,
                        }))
                      : [
                          {
                            netPrice: product.netPrice,
                            discount: product.discount,
                            grossPrice: product.grossPrice,
                          },
                        ]
                    const priceSummary = listingPriceSummary(priceLines, product.vatPercent)
                    const grossPrice = priceSummary.unitGross
                    const maxDiscount = priceSummary.maxDiscount
                    const showFromPrice = needsVariantSelection && listingHasPriceRange(priceLines, product.vatPercent)
                    return (
                  <tr key={productId} className={cn("hover:bg-white/5 transition-colors group", isDeleted && "opacity-60")}>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-none bg-neutral-900 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-white/25 transition-colors">
                          <FallbackImage src={mediaImageSrc(product.images?.[0])} alt={product.name} width={56} height={56} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                          <p className="font-heading font-black text-white uppercase tracking-wider text-base">{product.name}</p>
                          <p className="text-[10px] text-neutral-600 font-black tracking-widest uppercase mt-0.5">/{product.slug}</p>
                          {isDeleted ? (
                            <p className="text-[10px] text-rose-400 font-black tracking-widest uppercase mt-1">
                              Törölve
                            </p>
                          ) : null}
                          {hasVariants ? (
                            <p className="text-[10px] admin-value font-black tracking-widest uppercase mt-1">
                              {variants.length} variáns
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px]">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn(
                          "w-fit px-2 py-1 border transition-colors",
                          product.isActive ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-neutral-500"
                        )}>
                          {product.isActive ? "AKTÍV" : "INAKTÍV"}
                        </span>
                        {!product.isVisible && (
                          <span className="w-fit px-2 py-1 bg-white/5 border border-white/5 text-neutral-600">
                            REJTETT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black uppercase tracking-widest ${stock > 10 ? 'text-white' : stock > 0 ? 'text-highlight' : 'text-rose-500'}`}>
                          {stock} DB
                        </span>
                        {stock <= 5 && (
                          <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div>
                        <p className="font-black text-white text-lg tracking-tighter">
                          {showFromPrice ? "Tól " : ""}
                          {formatHuf(grossPrice)}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                          Nettó {formatHuf(priceSummary.unitNet)} · ÁFA {formatHuf(priceSummary.unitVat)} ({priceSummary.vatPercent}%)
                        </p>
                        {maxDiscount > 0 && (
                          <p className="text-[10px] text-highlight font-black uppercase tracking-widest mt-1">-{maxDiscount}% KEDVEZMÉNY</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <ProductRowActions
                        productId={productId}
                        productName={product.name}
                        productSlug={product.slug}
                        isDeleted={isDeleted}
                      />
                    </td>
                  </tr>
                    )
                }))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/products?${new URLSearchParams({ ...currentParams, page: String(p) }).toString()}`}>
              <Button 
                variant={p === currentPage ? "default" : "ghost"}
                className={p === currentPage ? "bg-primary text-white" : "text-white/40"}
              >
                {p}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
