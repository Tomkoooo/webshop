import { ProductService, type ProductFilters } from "@wse/core/services/product"
import { Plus, Search as SearchIcon, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@wse/core/components/ui/badge"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { Input } from "@wse/core/components/ui/input"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminDataTable } from "@wse/core/components/admin/AdminDataTable"
import { cn } from "@wse/core/lib/utils"
import { formatHuf, listingHasPriceRange, listingPriceSummary } from "@wse/core/lib/pricing"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { ProductRowActions } from "./ProductRowActions"

type AdminProductVariant = {
  netPrice?: number
  grossPrice?: number | null
  discount?: number
  stock?: number
  isActive?: boolean
}

type AdminProductListRow = {
  _id: string | { toString(): string }
  name: string
  slug: string
  images?: string[]
  isActive?: boolean
  isVisible?: boolean
  deletedAt?: string | Date | null
  stock?: number
  netPrice: number
  grossPrice?: number | null
  discount?: number
  vatPercent?: number
  requireVariantSelection?: boolean
  variants?: AdminProductVariant[]
}

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    q?: string
    active?: string
    visible?: string
    discounted?: string
    deleted?: string
  }>
}) {
  const { page, q, active, visible, discounted, deleted } = await searchParams
  const currentPage = parseInt(page || "1")

  const filters: ProductFilters = { search: q }
  if (active === "true") filters.isActive = true
  if (active === "false") filters.isActive = false
  if (visible === "true") filters.isVisible = true
  if (visible === "false") filters.isVisible = false
  if (discounted === "true") filters.isDiscounted = true
  if (deleted === "true") filters.deleted = true

  const { products, total, pages } = await ProductService.getPaginated(currentPage, 10, filters)
  const listProducts = products as unknown as AdminProductListRow[]
  const currentParams = {
    ...(q ? { q } : {}),
    ...(active ? { active } : {}),
    ...(visible ? { visible } : {}),
    ...(discounted ? { discounted } : {}),
    ...(deleted ? { deleted } : {}),
  }

  const filterLink = (key: string, value: string) => {
    const next = { ...currentParams, [key]: currentParams[key as keyof typeof currentParams] === value ? "" : value }
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== "")) as Record<string, string>
    ).toString()
    return qs ? `/admin/products?${qs}` : "/admin/products"
  }

  return (
    <AdminPageScaffold
      title="Termékek"
      description="Kezelje a bolt árukészletét, árait és kategóriáit."
      actions={
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Új termék
          </Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <form method="GET">
              <Input name="q" defaultValue={q} placeholder="Keresés név vagy slug alapján…" className="pl-9" />
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant={active === "true" ? "secondary" : "outline"} size="sm" asChild>
              <Link href={filterLink("active", "true")}>Aktív</Link>
            </Button>
            <Button variant={visible === "true" ? "secondary" : "outline"} size="sm" asChild>
              <Link href={filterLink("visible", "true")}>Látható</Link>
            </Button>
            <Button variant={discounted === "true" ? "secondary" : "outline"} size="sm" asChild>
              <Link href={filterLink("discounted", "true")}>Akciós</Link>
            </Button>
            <Button
              variant={deleted === "true" ? "destructive" : "outline"}
              size="sm"
              asChild
            >
              <Link href={filterLink("deleted", "true")}>Töröltek</Link>
            </Button>
            {Object.values(currentParams).some((v) => v !== undefined && v !== "") ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/products">Szűrők törlése</Link>
              </Button>
            ) : null}
          </div>

          <p className="text-muted-foreground shrink-0 text-sm">
            Találat: <span className="text-foreground font-medium">{total}</span>
          </p>
        </CardContent>
      </Card>

      <AdminDataTable
        rows={listProducts}
        getRowKey={(product) => product._id.toString()}
        emptyMessage="Nem található a keresésnek megfelelő termék."
        columns={[
          {
            id: "product",
            header: "Termék",
            cell: (product) => {
              const productId = product._id.toString()
              const isDeleted = Boolean(product.deletedAt)
              const variants = Array.isArray(product.variants)
                ? product.variants.filter((variant) => variant.isActive !== false)
                : []
              const hasVariants = variants.length > 0
              return (
                <div className="flex items-center gap-4">
                  <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                    <FallbackImage
                      src={mediaImageSrc(product.images?.[0])}
                      alt={product.name}
                      width={56}
                      height={56}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-xs">/{product.slug}</p>
                    {isDeleted ? (
                      <Badge variant="outline" className="mt-1 border-rose-500/30 text-rose-700">
                        Törölve
                      </Badge>
                    ) : null}
                    {hasVariants ? (
                      <p className="text-muted-foreground mt-1 text-xs">{variants.length} variáns</p>
                    ) : null}
                  </div>
                </div>
              )
            },
          },
          {
            id: "status",
            header: "Állapot",
            cell: (product) => (
              <div className="flex flex-col gap-1.5">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Aktív" : "Inaktív"}
                </Badge>
                {!product.isVisible ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    Rejtett
                  </Badge>
                ) : null}
              </div>
            ),
          },
          {
            id: "stock",
            header: "Készlet",
            cell: (product) => {
              const stock = Number(product.stock ?? 0)
              return (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      stock > 10 ? "text-foreground" : stock > 0 ? "text-amber-600" : "text-rose-600"
                    )}
                  >
                    {stock} db
                  </span>
                  {stock <= 5 ? <AlertCircle className="size-4 text-rose-500" /> : null}
                </div>
              )
            },
          },
          {
            id: "price",
            header: "Ár",
            cell: (product) => {
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
              const showFromPrice =
                needsVariantSelection && listingHasPriceRange(priceLines, product.vatPercent)
              return (
                <div>
                  <p className="font-semibold tabular-nums">
                    {showFromPrice ? "Tól " : ""}
                    {formatHuf(priceSummary.unitGross)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Nettó {formatHuf(priceSummary.unitNet)} · ÁFA {priceSummary.vatPercent}%
                  </p>
                  {priceSummary.maxDiscount > 0 ? (
                    <p className="mt-1 text-xs font-medium text-primary">
                      -{priceSummary.maxDiscount}% kedvezmény
                    </p>
                  ) : null}
                </div>
              )
            },
          },
          {
            id: "actions",
            header: "Műveletek",
            headerClassName: "text-right",
            className: "text-right",
            cell: (product) => (
              <ProductRowActions
                productId={product._id.toString()}
                productName={product.name}
                productSlug={product.slug}
                isDeleted={Boolean(product.deletedAt)}
              />
            ),
          },
        ]}
      />

      {pages > 1 ? (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === currentPage ? "default" : "outline"} size="sm" asChild>
              <Link
                href={`/admin/products?${new URLSearchParams({ ...currentParams, page: String(p) }).toString()}`}
              >
                {p}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}
    </AdminPageScaffold>
  )
}
