"use client"

import { useMemo, useState, useTransition } from "react"
import { Save, ArrowLeft, Info, Trash2, Star, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@wse/core/components/ui/collapsible"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@wse/core/components/ui/dialog"
import { MultiImageUpload } from "@wse/core/components/admin/MultiImageUpload"
import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor"
import { ProductVariantsEditor } from "@wse/core/components/admin/ProductVariantsEditor"
import { normalizeUniqueNumberedVariants } from "@wse/core/lib/unique-numbered-variants"
import { AdminPricePairFields } from "@wse/core/components/admin/AdminPricePairFields"
import {
  createProduct,
  updateProduct,
  deleteProduct,
  resetProductLimitedPriceCounters,
} from "@wse/core/actions/admin-products"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { Card, CardContent, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { adminAlertInfo, adminAlertWarning, adminFieldHint, adminInputClass } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
import { netToGross } from "@wse/core/lib/pricing"
import { useAdminPricePair } from "@wse/core/hooks/useAdminPricePair"
import {
  deriveProductLevelFromVariants,
  normalizeAdminVariants,
  type AdminVariantInput,
  type AdminVariantRow,
} from "@wse/core/lib/admin-product-variants"

type IdLike = { toString(): string }
type CategoryLike = IdLike & { _id?: IdLike; name?: string }
type ProductRating = {
  rating: number
  createdAt: string | Date
  comment?: string
  user?: { name?: string } | IdLike
}
type ProductVariantOption = { name: string; values: string[] }
type ProductFormInitialData = {
  _id?: IdLike
  name?: string
  description?: string
  images?: string[]
  isActive?: boolean
  isVisible?: boolean
  vatPercent?: number
  netPrice?: number
  grossPrice?: number
  discount?: number
  limitedPrice?: {
    enabled?: boolean
    limitQuantity?: number
    netPrice?: number
    grossPrice?: number
    reservedCount?: number
    soldCount?: number
    claimedCount?: number
  }
  stock?: number
  category?: CategoryLike
  variantOptions?: ProductVariantOption[]
  variants?: AdminVariantInput[]
  requireVariantSelection?: boolean
  uniqueNumberedVariants?: {
    enabled?: boolean
    attributeName?: string
    maxQuantityPerLine?: number
    descriptionHtml?: string
    baseVariantId?: string
    numberRanges?: Array<{ from: number; to: number; exclude?: number[] }>
  } | null
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  ratings?: ProductRating[]
  featuredListIndex?: number | null
}

interface ProductFormProps {
  categories: Array<{ _id: IdLike; name: string }>
  initialData?: ProductFormInitialData
  isEdit?: boolean
  visualPageHref?: string
}

function getRatingUserName(user: ProductRating["user"]) {
  if (user && typeof user === "object" && "name" in user && typeof user.name === "string") {
    return user.name
  }
  return "VENDÉG VÁSÁRLÓ"
}

export default function ProductForm({ categories, initialData, isEdit, visualPageHref }: ProductFormProps) {
  const router = useRouter()
  const productId = initialData?._id?.toString() || ""
  const productName = initialData?.name || ""
  const [images, setImages] = useState<string[]>(initialData?.images || [])
  const [description, setDescription] = useState(initialData?.description || "")
  const [isActive, setIsActive] = useState(initialData?.isActive ?? false)
  const [isVisible, setIsVisible] = useState(initialData?.isVisible ?? true)
  const [vatPercent, setVatPercent] = useState(Number(initialData?.vatPercent ?? 27))
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isResettingLimiter, startResetLimiterTransition] = useTransition()
  const [limiterResetMessage, setLimiterResetMessage] = useState<string | null>(null)
  const [seoOpen, setSeoOpen] = useState(
    Boolean(initialData?.seo?.title || initialData?.seo?.description || initialData?.seo?.keywords?.length)
  )

  const initialNet = Number(initialData?.netPrice || 0)
  const initialGross =
    initialData?.grossPrice != null && initialData.grossPrice > 0
      ? Number(initialData.grossPrice)
      : netToGross(initialNet, Number(initialData?.vatPercent ?? 27))

  const productPrice = useAdminPricePair(initialNet, vatPercent, initialGross)
  const initialLimitedNet = Number(initialData?.limitedPrice?.netPrice || 0)
  const initialLimitedGross =
    initialData?.limitedPrice?.grossPrice != null && initialData.limitedPrice.grossPrice > 0
      ? Number(initialData.limitedPrice.grossPrice)
      : initialLimitedNet > 0
        ? netToGross(initialLimitedNet, Number(initialData?.vatPercent ?? 27))
        : 0
  const limitedPrice = useAdminPricePair(initialLimitedNet, vatPercent, initialLimitedGross)
  const [limitedPriceEnabled, setLimitedPriceEnabled] = useState(Boolean(initialData?.limitedPrice?.enabled))
  const [limitedPriceLimitQuantity, setLimitedPriceLimitQuantity] = useState(
    Number(initialData?.limitedPrice?.limitQuantity || 0)
  )

  const [variantsEnabled, setVariantsEnabled] = useState(
    (initialData?.variants?.length ?? 0) > 0 || (initialData?.variantOptions?.length ?? 0) > 0
  )
  const [requireVariantSelection, setRequireVariantSelection] = useState(
    Boolean(initialData?.requireVariantSelection)
  )
  const [editorVariants, setEditorVariants] = useState<AdminVariantRow[]>(() =>
    normalizeAdminVariants(
      initialData?.variants || [],
      initialNet
    )
  )

  const mandatoryVariants = variantsEnabled && requireVariantSelection
  const optionalVariants = variantsEnabled && !requireVariantSelection
  const simpleProduct = !variantsEnabled

  const derivedFromVariants = useMemo(
    () => deriveProductLevelFromVariants(editorVariants),
    [editorVariants]
  )

  const summaryGross = mandatoryVariants
    ? derivedFromVariants.grossPrice || netToGross(derivedFromVariants.netPrice, vatPercent)
    : productPrice.grossPrice
  const submitGrossPrice = summaryGross
  const deleteConfirmed = productName.trim().length > 0 && deleteConfirmation.trim() === productName.trim()
  const limitedClaimedCount = Number(initialData?.limitedPrice?.claimedCount || 0)
  const limitedReservedCount = Number(initialData?.limitedPrice?.reservedCount || 0)
  const limitedSoldCount = Number(initialData?.limitedPrice?.soldCount || 0)
  const limitedRemainingCount = Math.max(0, limitedPriceLimitQuantity - limitedClaimedCount)

  const handleDeleteProduct = () => {
    if (!productId || !deleteConfirmed || isDeleting) return
    setDeleteError(null)
    startDeleteTransition(async () => {
      try {
        await deleteProduct(productId, deleteConfirmation)
        router.push("/admin/products")
        router.refresh()
      } catch (error) {
        setDeleteError(error instanceof Error ? error.message : "A törlés sikertelen.")
      }
    })
  }

  const handleResetSimpleLimiter = () => {
    if (!productId || isResettingLimiter) return
    const confirmed = window.confirm(
      "Biztosan nullázod a limitált ár számlálóit? A limit és az árak megmaradnak, csak a foglalt/eladott/claimed érték lesz 0."
    )
    if (!confirmed) return
    setLimiterResetMessage(null)
    startResetLimiterTransition(async () => {
      try {
        await resetProductLimitedPriceCounters(productId)
        setLimiterResetMessage("Limit számlálók nullázva.")
        router.refresh()
      } catch (error) {
        setLimiterResetMessage(error instanceof Error ? error.message : "A limit számlálók nullázása sikertelen.")
      }
    })
  }

  return (
    <AdminPageScaffold
      title={isEdit ? "Termék szerkesztése" : "Új termék"}
      actions={
        <>
          <Link href="/admin/products">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted hover:text-foreground">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          {visualPageHref ? (
            <Link href={visualPageHref}>
              <Button type="button" variant="outline" className="text-sm">
                Vizuális oldal
              </Button>
            </Link>
          ) : null}
        </>
      }
      className="pb-20"
    >
      <form
        action={isEdit ? updateProduct.bind(null, productId) : createProduct}
        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Alapadatok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AdminFormField label="Termék neve">
                  <Input
                    name="name"
                    required
                    defaultValue={initialData?.name}
                    placeholder="Termék neve"
                  />
                </AdminFormField>

                <AdminFormField label="Kategória">
                  <select
                    name="category"
                    required
                    defaultValue={initialData?.category?._id?.toString() || initialData?.category?.toString() || ""}
                    className={adminInputClass}
                  >
                    <option value="">Válasszon kategóriát…</option>
                    {categories.map((cat) => (
                      <option key={cat._id.toString()} value={cat._id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </AdminFormField>
              </div>

              <AdminFormField label="Termék képei">
                <MultiImageUpload currentImages={images} onUpload={(imgs) => setImages(imgs)} flexibleCrop />
              </AdminFormField>

              <AdminFormField
                label="Termék leírása"
                hint="Formázott szöveg és képek — ugyanaz a szerkesztő, mint az e-maileknél."
              >
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Részletes leírás…"
                  variant="mail"
                />
                <input type="hidden" name="description" value={description} />
              </AdminFormField>
            </CardContent>
          </Card>

          {simpleProduct && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Árazás és készlet</CardTitle>
              <p className={adminFieldHint}>
                A bruttó ár az, amit a vevő fizet. A nettó a számlázáshoz kerül mentésre.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-5">
                <AdminPricePairFields
                  netPrice={productPrice.netPrice}
                  grossPrice={productPrice.grossPrice}
                  vatPercent={vatPercent}
                  onNetChange={productPrice.setNetPrice}
                  onGrossChange={productPrice.setGrossPrice}
                  netName="netPrice"
                />
                <AdminFormField label="ÁFA kulcs (%)">
                  <Input
                    type="number"
                    name="vatPercent"
                    min={0}
                    max={100}
                    step={1}
                    value={vatPercent}
                    onChange={(e) => setVatPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  />
                </AdminFormField>
                <AdminFormField label="Kedvezmény (%)">
                  <Input
                    type="number"
                    name="discount"
                    defaultValue={initialData?.discount}
                    placeholder="0"
                  />
                </AdminFormField>
                <AdminFormField label="Készlet (db)">
                  <Input
                    type="number"
                    name="stock"
                    required
                    defaultValue={initialData?.stock}
                    placeholder="0"
                  />
                </AdminFormField>
              </div>
              <div className={cn(adminAlertWarning, "space-y-4")}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Első X darab egyedi ára</p>
                    <p className={cn(adminFieldHint, "mt-1")}>
                      Egyszerű, variáns nélküli termékekhez. A foglalt és eladott darabokat a rendelési folyamat kezeli.
                    </p>
                    <p className={cn(adminFieldHint, "mt-2")}>
                      Maradt: {limitedRemainingCount} · Felhasználva: {limitedClaimedCount} · Foglalt:{" "}
                      {limitedReservedCount} · Eladott: {limitedSoldCount}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={limitedPriceEnabled}
                      onChange={(event) => setLimitedPriceEnabled(event.target.checked)}
                    />
                    Bekapcsolva
                  </label>
                </div>
                {isEdit ? (
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 md:flex-row md:items-center md:justify-between">
                    <p className={adminFieldHint}>
                      Teszt rendelések után itt nullázható csak a limit számláló. A készlet és az árak nem változnak.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isResettingLimiter}
                      onClick={handleResetSimpleLimiter}
                      className="h-10 shrink-0"
                    >
                      {isResettingLimiter ? "Nullázás..." : "Limit számláló nullázása"}
                    </Button>
                  </div>
                ) : null}
                {limiterResetMessage ? (
                  <p className="text-sm text-amber-900">{limiterResetMessage}</p>
                ) : null}
                <input type="hidden" name="limitedPriceEnabled" value={limitedPriceEnabled ? "true" : "false"} />
                <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
                  <AdminFormField label="Limit (db)">
                    <Input
                      type="number"
                      name="limitedPriceLimitQuantity"
                      min={0}
                      value={limitedPriceLimitQuantity || ""}
                      onChange={(event) =>
                        setLimitedPriceLimitQuantity(Math.max(0, Math.round(Number(event.target.value) || 0)))
                      }
                      placeholder="Pl. 412"
                    />
                  </AdminFormField>
                  <AdminPricePairFields
                    netPrice={limitedPrice.netPrice}
                    grossPrice={limitedPrice.grossPrice}
                    vatPercent={vatPercent}
                    onNetChange={limitedPrice.setNetPrice}
                    onGrossChange={limitedPrice.setGrossPrice}
                    netName="limitedPriceNetPrice"
                    grossName="limitedPriceGrossPrice"
                    compact
                    className="md:col-span-2"
                  />
                </div>
              </div>
              <input type="hidden" name="grossPrice" value={productPrice.grossPrice} />
            </CardContent>
          </Card>
          )}

          {optionalVariants && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Alap termék (variáns nélkül)</CardTitle>
              <p className={adminFieldHint}>
                Ha a vevő nem választ variánst, ezek az árak és készlet érvényesek.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <AdminPricePairFields
                  netPrice={productPrice.netPrice}
                  grossPrice={productPrice.grossPrice}
                  vatPercent={vatPercent}
                  onNetChange={productPrice.setNetPrice}
                  onGrossChange={productPrice.setGrossPrice}
                  netName="netPrice"
                />
                <AdminFormField label="Kedvezmény (%)">
                  <Input
                    type="number"
                    name="discount"
                    defaultValue={initialData?.discount}
                  />
                </AdminFormField>
                <AdminFormField label="Készlet (db)">
                  <Input
                    type="number"
                    name="stock"
                    required
                    defaultValue={initialData?.stock}
                  />
                </AdminFormField>
              </div>
              <input type="hidden" name="grossPrice" value={productPrice.grossPrice} />
            </CardContent>
          </Card>
          )}

          <ProductVariantsEditor
            productId={productId}
            isEdit={Boolean(isEdit)}
            initialOptions={initialData?.variantOptions || []}
            initialVariants={editorVariants}
            variants={editorVariants}
            defaultNetPrice={productPrice.netPrice}
            defaultGrossPrice={productPrice.grossPrice}
            vatPercent={vatPercent}
            onVatChange={setVatPercent}
            initialRequireVariantSelection={initialData?.requireVariantSelection || false}
            initialUniqueNumberedVariants={
              normalizeUniqueNumberedVariants(initialData?.uniqueNumberedVariants) ?? null
            }
            onModeChange={({ enabled, requireVariantSelection: req }) => {
              setVariantsEnabled(enabled)
              setRequireVariantSelection(req)
            }}
            onVariantsChange={setEditorVariants}
          />

          {mandatoryVariants ? (
            <>
              <input type="hidden" name="netPrice" value={derivedFromVariants.netPrice} />
              <input type="hidden" name="grossPrice" value={submitGrossPrice} />
              <input type="hidden" name="stock" value={derivedFromVariants.stock} />
              <input type="hidden" name="discount" value={derivedFromVariants.discount} />
            </>
          ) : null}

          <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
            <Card className="shadow-sm">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-6 pt-6 text-left"
                >
                  <div>
                    <h2 className="text-lg font-semibold">SEO (opcionális)</h2>
                    <p className="text-sm text-muted-foreground">Csak akkor kell, ha eltér a terméknévtől.</p>
                  </div>
                  <ChevronDown className={cn("size-4 shrink-0 transition-transform", seoOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  <AdminFormField label="Keresőcím">
                    <Input name="seo_title" defaultValue={initialData?.seo?.title} placeholder="Ha üres, a terméknév lesz használva" />
                  </AdminFormField>
                  <AdminFormField label="Meta leírás">
                    <textarea
                      name="seo_description"
                      rows={3}
                      defaultValue={initialData?.seo?.description}
                      placeholder="Rövid összefoglaló a keresőknek"
                      className={cn(adminInputClass, "min-h-[80px] py-2")}
                    />
                  </AdminFormField>
                  <AdminFormField label="Kulcsszavak">
                    <Input
                      name="seo_keywords"
                      defaultValue={initialData?.seo?.keywords?.join(", ")}
                      placeholder="vesszővel elválasztva"
                    />
                  </AdminFormField>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {isEdit && initialData?.ratings && initialData.ratings.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Vásárlói vélemények</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {initialData.ratings.map((rating, index) => (
                <div key={index} className="space-y-3 rounded-lg bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-4",
                            i < rating.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rating.createdAt).toLocaleDateString("hu-HU")}
                    </span>
                  </div>
                  {rating.comment ? (
                    <p className="text-sm text-foreground italic">&quot;{rating.comment}&quot;</p>
                  ) : null}
                  <p className="text-right text-xs text-muted-foreground">
                    {getRatingUserName(rating.user)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Státusz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={cn(adminAlertWarning, "space-y-3")}>
                <p className="text-sm font-medium text-foreground">Teszt / előnézet</p>
                <p className={adminFieldHint}>
                  Látható + inaktív: a termék megjelenik a boltban és kipróbálható, de senki nem rendelheti (kosár és fizetés tiltva).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsVisible(true)
                    setIsActive(false)
                  }}
                >
                  Előnézet mód bekapcsolása
                </Button>
                {isVisible && !isActive ? (
                  <p className="text-sm text-amber-900">Előnézet mód aktív — nem rendelhető</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Aktív</p>
                  <p className={adminFieldHint}>Rendelhető-e (ki = csak böngészés)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    "h-7 w-14 rounded-md p-1 transition-colors duration-200 focus:outline-none",
                    isActive ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "size-5 bg-white transition-transform duration-200",
                      isActive ? "translate-x-7" : "translate-x-0"
                    )}
                  />
                </button>
                <input type="hidden" name="isActive" value={isActive.toString()} />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Látható</p>
                  <p className={adminFieldHint}>Bolt és termékoldal (ki = rejtett)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className={cn(
                    "h-7 w-14 rounded-md p-1 transition-colors duration-200 focus:outline-none",
                    isVisible ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "size-5 bg-white transition-transform duration-200",
                      isVisible ? "translate-x-7" : "translate-x-0"
                    )}
                  />
                </button>
                <input type="hidden" name="isVisible" value={isVisible.toString()} />
              </div>

              <AdminFormField
                label="Kiemelt lista index (főoldal)"
                hint="Kisebb szám = előrébb a kiemelt szekcióban (kategória mód / egyedi lista)."
              >
                <Input
                  name="featuredListIndex"
                  type="number"
                  step={1}
                  defaultValue={
                    initialData?.featuredListIndex != null
                      ? String(initialData.featuredListIndex)
                      : ""
                  }
                  placeholder="Üres = nincs prioritás"
                />
              </AdminFormField>
            </CardContent>

            <CardHeader className="border-t">
              <CardTitle className="text-lg">Műveletek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="submit" variant="default" className="h-12 w-full">
                <Save className="size-5" />
                Mentés
              </Button>
              <Link href="/admin/products" className="block">
                <Button type="button" variant="outline" className="h-11 w-full">
                  Mégse
                </Button>
              </Link>

              {isEdit && (
                <div className="border-t border-border pt-6">
                  <Dialog
                    open={deleteDialogOpen}
                    onOpenChange={(open) => {
                      setDeleteDialogOpen(open)
                      if (!open) {
                        setDeleteConfirmation("")
                        setDeleteError(null)
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-12 w-full text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                      >
                        <Trash2 className="mr-3 size-5" />
                        Termék törlése
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Termék törlése</DialogTitle>
                        <DialogDescription>
                          Ez elrejti és inaktívvá teszi a terméket. Később a törölt termékek nézetből visszaállítható.
                          Biztonsági okból írd be pontosan a termék nevét:
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <p className="rounded-lg bg-muted/50 px-3 py-2 font-mono text-sm text-foreground">
                          {productName}
                        </p>
                        <Input
                          value={deleteConfirmation}
                          onChange={(event) => setDeleteConfirmation(event.target.value)}
                          placeholder="Terméknév pontosan"
                        />
                        {deleteError ? (
                          <p className="text-sm text-rose-600">{deleteError}</p>
                        ) : null}
                      </div>
                      <DialogFooter className="gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteDialogOpen(false)}
                          disabled={isDeleting}
                        >
                          Mégse
                        </Button>
                        <Button
                          type="button"
                          onClick={handleDeleteProduct}
                          disabled={!deleteConfirmed || isDeleting}
                          variant="destructive"
                        >
                          {isDeleting ? "Törlés..." : "Termék törlése"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>

            <CardContent className="border-t pt-0">
              <div className={cn(adminAlertInfo, "flex items-start gap-3")}>
                <Info className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm">
                  A mentés után a változtatások azonnal életbe lépnek a boltban.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </AdminPageScaffold>
  )
}
