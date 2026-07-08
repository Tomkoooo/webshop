"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, WandSparkles } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { Input } from "@wse/core/components/ui/input";
import { cn, slugify } from "@wse/core/lib/utils";
import { deriveNetFromGross, netToGross } from "@wse/core/lib/pricing";
import { AdminFormField } from "@wse/core/components/admin/AdminFormField";
import {
  deriveVariantGrossBounds,
  hasVariantPriceOverride,
  resolveVariantGrossPrice,
  variantGrossForDisplay,
  type AdminVariantRow,
} from "@wse/core/lib/admin-product-variants";
import { formatHuf } from "@wse/core/lib/pricing";
import { resetProductLimitedPriceCounters } from "@wse/core/actions/admin-products";
import { NumberedVariantsGenerator } from "@wse/core/components/admin/NumberedVariantsGenerator";
import { NumberedVariantsManager } from "@wse/core/components/admin/NumberedVariantsManager";
import { isNumberedVariantId, rebuildNumberedVariantOptions } from "@wse/core/lib/numbered-variant-ranges";
import type { UniqueNumberedVariantsConfig } from "@wse/core/lib/unique-numbered-variants";

type VariantOption = { name: string; values: string[] };

type Props = {
  productId?: string;
  isEdit?: boolean;
  initialOptions?: VariantOption[];
  initialVariants?: AdminVariantRow[];
  variants: AdminVariantRow[];
  defaultNetPrice: number;
  defaultGrossPrice?: number;
  initialRequireVariantSelection?: boolean;
  initialUniqueNumberedVariants?: UniqueNumberedVariantsConfig | null;
  vatPercent: number;
  onVatChange: (vat: number) => void;
  onModeChange?: (mode: { enabled: boolean; requireVariantSelection: boolean }) => void;
  onVariantsChange: (variants: AdminVariantRow[]) => void;
};

function cartesianProduct(optionGroups: Array<{ name: string; values: string[] }>) {
  if (optionGroups.length === 0) return [];
  return optionGroups.reduce<Array<Record<string, string>>>(
    (acc, group) => {
      const next: Array<Record<string, string>> = [];
      for (const combination of acc) {
        for (const value of group.values) {
          next.push({ ...combination, [group.name]: value });
        }
      }
      return next;
    },
    [{}]
  );
}

function attributesToId(attributes: Record<string, string>) {
  const source = Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}-${value}`)
    .join("-");
  return slugify(source) || `variant-${Date.now()}`;
}

function attributesToLabel(attributes: Record<string, string>) {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ");
}

function numericInputValue(value: number | undefined | null) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? String(n) : "";
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function ProductVariantsEditor({
  productId,
  isEdit = false,
  initialOptions = [],
  initialVariants = [],
  variants,
  defaultNetPrice,
  defaultGrossPrice,
  initialRequireVariantSelection = false,
  initialUniqueNumberedVariants = null,
  vatPercent,
  onVatChange,
  onModeChange,
  onVariantsChange,
}: Props) {
  const router = useRouter();
  const [isResettingLimiter, startResetLimiterTransition] = useTransition();
  const [limiterResetMessage, setLimiterResetMessage] = useState<string | null>(null);
  const setVariants = (
    updater: AdminVariantRow[] | ((prev: AdminVariantRow[]) => AdminVariantRow[])
  ) => {
    onVariantsChange(typeof updater === "function" ? updater(variants) : updater);
  };
  const [enabled, setEnabled] = useState(initialVariants.length > 0 || initialOptions.length > 0);
  const [requireVariantSelection, setRequireVariantSelection] = useState(
    Boolean(initialRequireVariantSelection)
  );
  const [uniqueNumberedVariants, setUniqueNumberedVariants] = useState<UniqueNumberedVariantsConfig | null>(
    initialUniqueNumberedVariants?.enabled ? initialUniqueNumberedVariants : null
  );
  const [options, setOptions] = useState<Array<{ name: string; valuesText: string }>>(
    initialOptions.length > 0
      ? initialOptions.map((option) => ({ name: option.name, valuesText: option.values.join(", ") }))
      : [{ name: "", valuesText: "" }]
  );
  const [bulkNetPrice, setBulkNetPrice] = useState("");
  const [bulkGrossPrice, setBulkGrossPrice] = useState("");
  const [bulkDiscount, setBulkDiscount] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [numberedListSearch, setNumberedListSearch] = useState("");
  const [activeVariantId, setActiveVariantId] = useState<string>(
    () =>
      initialVariants.find((v) => v.isDefault)?.id ||
      initialVariants[0]?.id ||
      variants.find((v) => v.isDefault)?.id ||
      variants[0]?.id ||
      ""
  );

  useEffect(() => {
    onModeChange?.({ enabled, requireVariantSelection });
  }, [enabled, requireVariantSelection, onModeChange]);

  const grossBounds = useMemo(
    () => deriveVariantGrossBounds(variants, vatPercent, defaultGrossPrice, defaultNetPrice),
    [variants, vatPercent, defaultGrossPrice, defaultNetPrice]
  );
  const totalStock = useMemo(
    () => variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    [variants]
  );
  const numberedMode = Boolean(uniqueNumberedVariants?.enabled);
  const listVariants = useMemo(() => {
    const baseId = uniqueNumberedVariants?.baseVariantId?.trim() || "base";
    let list = numberedMode
      ? variants.filter((v) => isNumberedVariantId(v.id) || v.id === baseId)
      : variants;
    const q = numberedListSearch.trim();
    if (numberedMode && q) {
      list = list.filter((v) => {
        const num = v.attributes?.[uniqueNumberedVariants?.attributeName || "Szám"] || "";
        return num.includes(q) || v.id.includes(q);
      });
    }
    return list;
  }, [variants, numberedMode, numberedListSearch, uniqueNumberedVariants?.attributeName]);
  const maxDiscount = useMemo(
    () => Math.max(0, ...variants.map((v) => Number(v.discount) || 0)),
    [variants]
  );

  const normalizedOptions = useMemo(() => {
    const grouped = new Map<string, Set<string>>();
    for (const option of options) {
      const name = option.name.trim();
      if (!name) continue;
      const values = option.valuesText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (values.length === 0) continue;
      if (!grouped.has(name)) grouped.set(name, new Set<string>());
      const bucket = grouped.get(name)!;
      for (const value of values) bucket.add(value);
    }
    return Array.from(grouped.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [options]);

  const variantOptionsJson = JSON.stringify(normalizedOptions);
  const variantsJson = JSON.stringify(
    variants.map((variant) => ({
      ...variant,
      seo: {
        title: variant.seo?.title || "",
        description: variant.seo?.description || "",
        keywords: (variant.seo?.keywords || []).filter(Boolean),
      },
    }))
  );

  const currentActiveVariantId = variants.some((variant) => variant.id === activeVariantId)
    ? activeVariantId
    : variants.find((variant) => variant.isDefault)?.id || variants[0]?.id || "";
  const activeVariantIndex = variants.findIndex((variant) => variant.id === currentActiveVariantId);
  const safeActiveIndex = activeVariantIndex >= 0 ? activeVariantIndex : variants.length > 0 ? 0 : -1;
  const activeVariant = safeActiveIndex >= 0 ? variants[safeActiveIndex] : null;
  const activeVariantUsesBasePrice = activeVariant
    ? !hasVariantPriceOverride(activeVariant, defaultNetPrice)
    : false;
  const activeVariantEffectiveGross = activeVariant
    ? variantGrossForDisplay(activeVariant, vatPercent, defaultGrossPrice, defaultNetPrice)
    : 0;
  const activeVariantNetInput =
    activeVariant && !activeVariantUsesBasePrice ? numericInputValue(activeVariant.netPrice) : "";
  const activeVariantGrossInput =
    activeVariant && !activeVariantUsesBasePrice
      ? numericInputValue(resolveVariantGrossPrice(activeVariant, vatPercent))
      : "";
  const activeLimited = activeVariant?.limitedPrice || {
    enabled: false,
    limitQuantity: 0,
    netPrice: undefined,
    grossPrice: undefined,
    reservedCount: 0,
    soldCount: 0,
    claimedCount: 0,
  };
  const activeLimitedNetInput = numericInputValue(activeLimited.netPrice);
  const activeLimitedGrossInput = numericInputValue(activeLimited.grossPrice);
  const activeLimitedClaimed = Number(activeLimited.claimedCount) || 0;
  const activeLimitedReserved = Number(activeLimited.reservedCount) || 0;
  const activeLimitedSold = Number(activeLimited.soldCount) || 0;
  const activeLimitedRemaining = Math.max(0, Number(activeLimited.limitQuantity || 0) - activeLimitedClaimed);

  const updateVariantPrices = (
    variantId: string,
    patch: { netPrice?: number; grossPrice?: number }
  ) => {
    setVariants((prev) =>
      prev.map((item) => (item.id === variantId ? { ...item, ...patch } : item))
    );
  };

  const clearVariantPriceOverride = (variantId: string) => {
    setVariants((prev) =>
      prev.map((item) =>
        item.id === variantId ? { ...item, netPrice: defaultNetPrice, grossPrice: undefined } : item
      )
    );
  };

  const updateVariantLimitedPrice = (
    variantId: string,
    patch: Partial<NonNullable<AdminVariantRow["limitedPrice"]>>
  ) => {
    setVariants((prev) =>
      prev.map((item) =>
        item.id === variantId
          ? {
              ...item,
              limitedPrice: {
                enabled: false,
                limitQuantity: 0,
                reservedCount: 0,
                soldCount: 0,
                claimedCount: 0,
                ...(item.limitedPrice || {}),
                ...patch,
              },
            }
          : item
      )
    );
  };

  const resetActiveVariantLimiter = (variantId: string) => {
    if (!productId || isResettingLimiter) return;
    const confirmed = window.confirm(
      "Biztosan nullázod ennek a variánsnak a limitált ár számlálóit? A limit és az árak megmaradnak."
    );
    if (!confirmed) return;
    setLimiterResetMessage(null);
    startResetLimiterTransition(async () => {
      try {
        await resetProductLimitedPriceCounters(productId, variantId);
        setVariants((prev) =>
          prev.map((item) =>
            item.id === variantId
              ? {
                  ...item,
                  limitedPrice: {
                    enabled: false,
                    limitQuantity: 0,
                    ...(item.limitedPrice || {}),
                    reservedCount: 0,
                    soldCount: 0,
                    claimedCount: 0,
                  },
                }
              : item
          )
        );
        setLimiterResetMessage("Limit számlálók nullázva.");
        router.refresh();
      } catch (error) {
        setLimiterResetMessage(error instanceof Error ? error.message : "A nullázás sikertelen.");
      }
    });
  };

  const updateBulkNetPrice = (value: string) => {
    setBulkNetPrice(value);
    const parsed = parseOptionalNumber(value);
    setBulkGrossPrice(parsed == null ? "" : String(netToGross(parsed, vatPercent)));
  };

  const updateBulkGrossPrice = (value: string) => {
    setBulkGrossPrice(value);
    const parsed = parseOptionalNumber(value);
    setBulkNetPrice(parsed == null ? "" : String(deriveNetFromGross(parsed, vatPercent)));
  };

  const generateCombinations = () => {
    if (normalizedOptions.length === 0) return;
    const matrix = cartesianProduct(normalizedOptions);
    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    const seenIds = new Map<string, number>();
    const nextVariants = matrix.map((attributes, index) => {
      const baseId = attributesToId(attributes);
      const count = seenIds.get(baseId) || 0;
      seenIds.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
      const existing = byId.get(id);
      const net = Number(defaultNetPrice) || 0;
      return (
        existing || {
          id,
          attributes,
          netPrice: net,
          grossPrice: undefined,
          discount: 0,
          stock: 0,
          isActive: true,
          isDefault: index === 0,
          limitedPrice: {
            enabled: false,
            limitQuantity: 0,
            netPrice: undefined,
            grossPrice: undefined,
            reservedCount: 0,
            soldCount: 0,
            claimedCount: 0,
          },
          sku: "",
          nameOverride: "",
          descriptionOverride: "",
          seo: { title: "", description: "", keywords: [] },
        }
      );
    });
    setVariants(nextVariants);
    setActiveVariantId(nextVariants[0]?.id || "");
  };

  const applyBulkValues = () => {
    const net = parseOptionalNumber(bulkNetPrice);
    const gross = parseOptionalNumber(bulkGrossPrice);
    const discount = parseOptionalNumber(bulkDiscount);
    const stock = parseOptionalNumber(bulkStock);
    const shouldUpdatePrice = net != null || gross != null;

    setVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        ...(shouldUpdatePrice
          ? {
              netPrice: net ?? deriveNetFromGross(gross ?? 0, vatPercent),
              grossPrice: gross ?? netToGross(net ?? 0, vatPercent),
            }
          : {}),
        ...(discount != null ? { discount } : {}),
        ...(stock != null ? { stock } : {}),
      }))
    );
  };

  const clearAllVariantPriceOverrides = () => {
    setVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        netPrice: defaultNetPrice,
        grossPrice: undefined,
      }))
    );
  };

  const setAllVariantsActive = (isActive: boolean) => {
    if (variants.length === 0) return;
    if (
      !isActive &&
      variants.length > 1 &&
      !window.confirm(
        `Kikapcsolod mind a ${variants.length} variánst? Egyik sem lesz rendelhető a boltban.`
      )
    ) {
      return;
    }
    const next = variants.map((variant) => ({ ...variant, isActive }));
    setVariants(next);
    if (numberedMode) {
      const attr = uniqueNumberedVariants?.attributeName || "Szám";
      const rebuilt = rebuildNumberedVariantOptions(next, attr);
      setOptions(
        rebuilt.length > 0
          ? rebuilt.map((option) => ({
              name: option.name,
              valuesText: option.values.join(", "),
            }))
          : [{ name: attr, valuesText: "" }]
      );
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-none p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-heading font-black italic uppercase tracking-wider text-white">Variánsok</h2>
        <button
          type="button"
          onClick={() => setEnabled((prev) => !prev)}
          className={cn(
            "w-14 h-7 rounded-none p-1 transition-colors duration-200 focus:outline-none",
            enabled ? "bg-primary" : "bg-neutral-800"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 bg-white transition-transform duration-200",
              enabled ? "translate-x-7" : "translate-x-0"
            )}
          />
        </button>
      </div>

      <input type="hidden" name="variantsEnabled" value={enabled ? "true" : "false"} />
      <input type="hidden" name="requireVariantSelection" value={enabled && requireVariantSelection ? "true" : "false"} />
      <input type="hidden" name="variantOptionsJson" value={enabled ? variantOptionsJson : "[]"} />
      <input type="hidden" name="variantsJson" value={enabled ? variantsJson : "[]"} />
      <input
        type="hidden"
        name="uniqueNumberedVariantsJson"
        value={JSON.stringify(
          uniqueNumberedVariants?.enabled
            ? uniqueNumberedVariants
            : { enabled: false }
        )}
      />

      {!enabled ? (
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
          Variánsok kikapcsolva. A termék egyetlen változatként jelenik meg.
        </p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-white/10 p-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">
                ÁFA kulcs (%) — minden variánsra
              </label>
              <Input
                type="number"
                name="vatPercent"
                min={0}
                max={100}
                step={1}
                value={vatPercent}
                onChange={(e) => onVatChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="bg-black border-white/5 h-11 text-white font-black tracking-widest focus-visible:ring-primary rounded-none"
              />
            </div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest self-end pb-2">
              A bruttó ár a vevő által fizetett összeg. A nettó a számlázáshoz kerül mentésre.
            </p>
          </div>

          <NumberedVariantsGenerator
            productId={productId}
            defaultNetPrice={defaultNetPrice}
            defaultGrossPrice={defaultGrossPrice}
            variants={variants}
            onVariantsChange={onVariantsChange}
            onOptionsChange={(opts) =>
              setOptions(opts.map((o) => ({ name: o.name, valuesText: o.values.join(", ") })))
            }
            uniqueNumberedVariants={uniqueNumberedVariants}
            onUniqueNumberedChange={setUniqueNumberedVariants}
            onRequireVariantChange={setRequireVariantSelection}
          />

          {uniqueNumberedVariants?.enabled ? (
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Egyedi sorszámos készlet mód aktív — max {uniqueNumberedVariants.maxQuantityPerLine} db / sor.
            </p>
          ) : null}

          {uniqueNumberedVariants?.enabled ? (
            <NumberedVariantsManager
              variants={variants}
              onVariantsChange={onVariantsChange}
              onOptionsChange={(opts) =>
                setOptions(opts.map((o) => ({ name: o.name, valuesText: o.values.join(", ") })))
              }
              uniqueNumberedVariants={uniqueNumberedVariants}
              onUniqueNumberedChange={setUniqueNumberedVariants}
              defaultNetPrice={defaultNetPrice}
              defaultGrossPrice={defaultGrossPrice}
              vatPercent={vatPercent}
              onActiveVariantChange={setActiveVariantId}
            />
          ) : null}

          <div className="flex items-center justify-between border border-white/10 p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">
                Kötelező variáns választás
              </p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                Ha bekapcsolt, a vevő nem teheti az alapterméket kosárba variáns nélkül.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequireVariantSelection((prev) => !prev)}
              className={cn(
                "w-14 h-7 rounded-none p-1 transition-colors duration-200 focus:outline-none",
                requireVariantSelection ? "bg-primary" : "bg-neutral-800"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 bg-white transition-transform duration-200",
                  requireVariantSelection ? "translate-x-7" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {!numberedMode ? (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
              Opció dimenziók
            </p>
            {options.map((option, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <Input
                  value={option.name}
                  onChange={(event) =>
                    setOptions((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, name: event.target.value } : item))
                    )
                  }
                  placeholder="Pl. Méret"
                  className="md:col-span-3 bg-black border-white/5 h-11 text-white rounded-none"
                />
                <Input
                  value={option.valuesText}
                  onChange={(event) =>
                    setOptions((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, valuesText: event.target.value } : item))
                    )
                  }
                  placeholder="Pl. 3x20, 4x30, 5x40"
                  className="md:col-span-8 bg-black border-white/5 h-11 text-white rounded-none"
                />
                <Button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                  variant="ghost"
                  className="md:col-span-1 h-11 text-rose-500 hover:text-white hover:bg-rose-500/20 rounded-none"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setOptions((prev) => [...prev, { name: "", valuesText: "" }])}
                variant="outline"
                className="h-10 rounded-none border-white/10 text-white hover:bg-white/5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Opció hozzáadása
              </Button>
              <Button
                type="button"
                onClick={generateCombinations}
                variant="outline"
                className="h-10 rounded-none admin-action-outline hover:bg-white/10"
              >
                <WandSparkles className="w-4 h-4 mr-2" />
                Variánsok generálása
              </Button>
            </div>
          </div>
          ) : null}

          {variants.length > 0 ? (
            <>
              <div className="border border-white/10 p-4 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                      Tömeges módosítás
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Csak a kitöltött mezők íródnak rá az összes variánsra.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearAllVariantPriceOverrides}
                      className="h-10 rounded-none border-white/10 text-white hover:bg-white/5"
                    >
                      Árak vissza alapárra
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAllVariantsActive(false)}
                      className="h-10 rounded-none border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
                    >
                      Összes kikapcsolása
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAllVariantsActive(true)}
                      className="h-10 rounded-none border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest"
                    >
                      Összes bekapcsolása
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <AdminFormField label="Nettó ár (Ft)">
                    <Input
                      type="number"
                      value={bulkNetPrice}
                      onChange={(event) => updateBulkNetPrice(event.target.value)}
                      placeholder="Nem módosítja"
                      className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                    />
                  </AdminFormField>
                  <AdminFormField label="Bruttó ár (Ft)">
                    <Input
                      type="number"
                      value={bulkGrossPrice}
                      onChange={(event) => updateBulkGrossPrice(event.target.value)}
                      placeholder="Nem módosítja"
                      className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                    />
                  </AdminFormField>
                  <AdminFormField label="Kedvezmény (%)">
                    <Input
                      type="number"
                      value={bulkDiscount}
                      onChange={(event) => setBulkDiscount(event.target.value)}
                      placeholder="Nem módosítja"
                      className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                    />
                  </AdminFormField>
                  <AdminFormField label="Készlet (db)">
                    <Input
                      type="number"
                      value={bulkStock}
                      onChange={(event) => setBulkStock(event.target.value)}
                      placeholder="Nem módosítja"
                      className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                    />
                  </AdminFormField>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={applyBulkValues}
                      className="h-11 w-full rounded-none bg-primary text-white"
                    >
                      Alkalmazás
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-4 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {numberedMode ? (
                    <Input
                      value={numberedListSearch}
                      onChange={(e) => setNumberedListSearch(e.target.value)}
                      placeholder="Keresés sorszámra…"
                      className="mb-2 h-10 rounded-none border-white/5 bg-black text-white text-sm"
                    />
                  ) : null}
                  {listVariants.length === 0 ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2">
                      {numberedMode ? "Nincs találat." : "Nincs variáns."}
                    </p>
                  ) : null}
                  {listVariants.map((variant) => (
                    <button
                      key={`selector-${variant.id}`}
                      type="button"
                      onClick={() => setActiveVariantId(variant.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 border text-[10px] font-black uppercase tracking-widest transition-colors",
                        activeVariant?.id === variant.id ? "admin-item-selected" : "admin-item-idle"
                      )}
                    >
                      <span className="block">{attributesToLabel(variant.attributes) || variant.id}</span>
                      <span className="mt-1 block text-[9px] text-neutral-500">
                        {formatHuf(variantGrossForDisplay(variant, vatPercent, defaultGrossPrice, defaultNetPrice))} ·{" "}
                        {Number(variant.stock) || 0} DB
                        {variant.isActive === false ? " · INAKTÍV" : ""}
                      </span>
                    </button>
                  ))}
                </div>
                {activeVariant ? (
                  <div key={activeVariant.id} className="xl:col-span-8 border border-white/10 p-4 space-y-4 bg-black/20">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="text-xs text-white font-black uppercase tracking-widest">
                          {attributesToLabel(activeVariant.attributes) || activeVariant.id}
                        </p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{activeVariant.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={activeVariant.isDefault ? "default" : "outline"}
                          className={cn(
                            "h-9 rounded-none text-[10px] font-black uppercase tracking-widest",
                            activeVariant.isDefault ? "bg-primary text-white" : "border-white/10 text-white hover:bg-white/5"
                          )}
                          onClick={() =>
                            setVariants((prev) =>
                              prev.map((item) => ({ ...item, isDefault: item.id === activeVariant.id }))
                            )
                          }
                        >
                          Alapértelmezett
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 rounded-none text-rose-500 hover:text-white hover:bg-rose-500/20"
                          onClick={() => {
                            const next = variants.filter((item) => item.id !== activeVariant.id);
                            setVariants(next);
                            setActiveVariantId(next.find((item) => item.isDefault)?.id || next[0]?.id || "");
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="border border-white/10 bg-black/30 p-4 space-y-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                            Egyedi ár
                          </p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Üresen hagyva ez a variáns az alap termék árát használja.
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Vevőnek érvényes bruttó
                          </p>
                          <p className="text-sm font-black uppercase tracking-widest text-white">
                            {formatHuf(activeVariantEffectiveGross)}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                            {activeVariantUsesBasePrice ? "Alapárból örökölve" : "Egyedi variánsárból"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2">
                        <AdminFormField label="Nettó ár (Ft)">
                          <Input
                            type="number"
                            value={activeVariantNetInput}
                            onChange={(event) => {
                              const net = parseOptionalNumber(event.target.value);
                              if (net == null) {
                                clearVariantPriceOverride(activeVariant.id);
                                return;
                              }
                              updateVariantPrices(activeVariant.id, {
                                netPrice: net,
                                grossPrice: netToGross(net, vatPercent),
                              });
                            }}
                            placeholder="Alapár"
                            className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                          />
                        </AdminFormField>
                        <AdminFormField label="Bruttó ár (Ft)">
                          <Input
                            type="number"
                            value={activeVariantGrossInput}
                            onChange={(event) => {
                              const gross = parseOptionalNumber(event.target.value);
                              if (gross == null) {
                                clearVariantPriceOverride(activeVariant.id);
                                return;
                              }
                              updateVariantPrices(activeVariant.id, {
                                grossPrice: gross,
                                netPrice: deriveNetFromGross(gross, vatPercent),
                              });
                            }}
                            placeholder="Alapár"
                            className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                          />
                        </AdminFormField>
                        <div className="md:col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => clearVariantPriceOverride(activeVariant.id)}
                            className="h-11 w-full rounded-none border-white/10 text-white hover:bg-white/5"
                          >
                            Alapár használata
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-white/10 bg-black/30 p-4 space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                            Első X darab egyedi ára
                          </p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Variánsonként külön limit. A foglalt és eladott darabokat a rendelési folyamat kezeli.
                          </p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                            Maradt: {activeLimitedRemaining} · Felhasználva: {activeLimitedClaimed} · Foglalt:{" "}
                            {activeLimitedReserved} · Eladott: {activeLimitedSold}
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400">
                          <input
                            type="checkbox"
                            checked={Boolean(activeLimited.enabled)}
                            onChange={(event) =>
                              updateVariantLimitedPrice(activeVariant.id, { enabled: event.target.checked })
                            }
                          />
                          Bekapcsolva
                        </label>
                      </div>

                      {isEdit && productId ? (
                        <div className="flex flex-col gap-2 border border-white/10 bg-black/20 p-3 md:flex-row md:items-center md:justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Teszt rendelések után itt nullázható csak ennek a variánsnak a limit számlálója.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isResettingLimiter}
                            onClick={() => resetActiveVariantLimiter(activeVariant.id)}
                            className="h-10 shrink-0 rounded-none border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                          >
                            {isResettingLimiter ? "Nullázás..." : "Limit számláló nullázása"}
                          </Button>
                        </div>
                      ) : null}
                      {limiterResetMessage ? (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                          {limiterResetMessage}
                        </p>
                      ) : null}

                      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-3">
                        <AdminFormField label="Limit (db)">
                          <Input
                            type="number"
                            value={activeLimited.limitQuantity || ""}
                            onChange={(event) =>
                              updateVariantLimitedPrice(activeVariant.id, {
                                limitQuantity: Math.max(0, Math.round(Number(event.target.value) || 0)),
                              })
                            }
                            placeholder="Pl. 412"
                            className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                          />
                        </AdminFormField>
                        <AdminFormField label="Limitált nettó ár (Ft)">
                          <Input
                            type="number"
                            value={activeLimitedNetInput}
                            onChange={(event) => {
                              const net = parseOptionalNumber(event.target.value);
                              updateVariantLimitedPrice(activeVariant.id, {
                                netPrice: net ?? undefined,
                                grossPrice: net == null ? undefined : netToGross(net, vatPercent),
                              });
                            }}
                            placeholder="Egyedi nettó"
                            className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                          />
                        </AdminFormField>
                        <AdminFormField label="Limitált bruttó ár (Ft)">
                          <Input
                            type="number"
                            value={activeLimitedGrossInput}
                            onChange={(event) => {
                              const gross = parseOptionalNumber(event.target.value);
                              updateVariantLimitedPrice(activeVariant.id, {
                                grossPrice: gross ?? undefined,
                                netPrice: gross == null ? undefined : deriveNetFromGross(gross, vatPercent),
                              });
                            }}
                            placeholder="Egyedi bruttó"
                            className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                          />
                        </AdminFormField>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <AdminFormField label="Kedvezmény (%)">
                        <Input
                          type="number"
                          value={activeVariant.discount}
                          onChange={(event) =>
                            setVariants((prev) =>
                              prev.map((item) =>
                                item.id === activeVariant.id
                                  ? { ...item, discount: Number(event.target.value) || 0 }
                                  : item
                              )
                            )
                          }
                          className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                        />
                      </AdminFormField>
                      <AdminFormField label="Készlet (db)">
                        <Input
                          type="number"
                          value={activeVariant.stock}
                          onChange={(event) =>
                            setVariants((prev) =>
                              prev.map((item) =>
                                item.id === activeVariant.id
                                  ? { ...item, stock: Number(event.target.value) || 0 }
                                  : item
                              )
                            )
                          }
                          className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                        />
                      </AdminFormField>
                      <AdminFormField label="SKU">
                        <Input
                          value={activeVariant.sku || ""}
                          onChange={(event) =>
                            setVariants((prev) =>
                              prev.map((item) =>
                                item.id === activeVariant.id ? { ...item, sku: event.target.value } : item
                              )
                            )
                          }
                          className="h-11 w-full rounded-none border-white/5 bg-black text-white"
                        />
                      </AdminFormField>
                    </div>

                    <div className="space-y-3">
                      <Input
                        value={activeVariant.nameOverride || ""}
                        onChange={(event) =>
                          setVariants((prev) =>
                            prev.map((item) =>
                              item.id === activeVariant.id ? { ...item, nameOverride: event.target.value } : item
                            )
                          )
                        }
                        className="bg-black border-white/5 h-11 text-white rounded-none"
                        placeholder="Név felülírása (opcionális)"
                      />
                      <textarea
                        value={activeVariant.descriptionOverride || ""}
                        onChange={(event) =>
                          setVariants((prev) =>
                            prev.map((item) =>
                              item.id === activeVariant.id ? { ...item, descriptionOverride: event.target.value } : item
                            )
                          )
                        }
                        rows={3}
                        className="w-full bg-black border-white/5 text-white rounded-none p-3 text-sm resize-y min-h-[88px]"
                        placeholder="Leírás felülírása (opcionális, HTML). Sorszámos terméknél felülírja a közös sorszámos leírást."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        value={activeVariant.seo?.title || ""}
                        onChange={(event) =>
                          setVariants((prev) =>
                            prev.map((item) =>
                              item.id === activeVariant.id
                                ? { ...item, seo: { ...item.seo, title: event.target.value } }
                                : item
                            )
                          )
                        }
                        className="bg-black border-white/5 h-11 text-white rounded-none"
                        placeholder="SEO cím"
                      />
                      <Input
                        value={activeVariant.seo?.description || ""}
                        onChange={(event) =>
                          setVariants((prev) =>
                            prev.map((item) =>
                              item.id === activeVariant.id
                                ? { ...item, seo: { ...item.seo, description: event.target.value } }
                                : item
                            )
                          )
                        }
                        className="bg-black border-white/5 h-11 text-white rounded-none"
                        placeholder="SEO leírás"
                      />
                      <Input
                        value={(activeVariant.seo?.keywords || []).join(", ")}
                        onChange={(event) =>
                          setVariants((prev) =>
                            prev.map((item) =>
                              item.id === activeVariant.id
                                ? {
                                    ...item,
                                    seo: {
                                      ...item.seo,
                                      keywords: event.target.value
                                        .split(",")
                                        .map((keyword) => keyword.trim())
                                        .filter(Boolean),
                                    },
                                  }
                                : item
                            )
                          )
                        }
                        className="bg-black border-white/5 h-11 text-white rounded-none"
                        placeholder="SEO kulcsszavak"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id={`variant-active-${activeVariant.id}`}
                        type="checkbox"
                        checked={activeVariant.isActive}
                        onChange={(event) =>
                          setVariants((prev) =>
                            prev.map((item) =>
                              item.id === activeVariant.id ? { ...item, isActive: event.target.checked } : item
                            )
                          )
                        }
                      />
                      <label
                        htmlFor={`variant-active-${activeVariant.id}`}
                        className="text-xs font-black uppercase tracking-widest text-neutral-400"
                      >
                        Aktív variáns
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>

              {requireVariantSelection && variants.length > 0 ? (
                <div className="border border-white/10 bg-black/30 p-4 space-y-3">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                    Összes variáns — összesítő
                  </p>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    Az árak variánsonként szerkeszthetők fent. Itt az összes aktív variáns
                    készlete és ártartománya látszik.
                  </p>
                  <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    <div>
                      <dt>Bruttó tartomány</dt>
                      <dd className="text-white text-sm mt-1">
                        {grossBounds.min <= 0 && grossBounds.max <= 0
                          ? "—"
                          : grossBounds.min === grossBounds.max
                            ? formatHuf(grossBounds.min)
                            : `${formatHuf(grossBounds.min)} – ${formatHuf(grossBounds.max)}`}
                      </dd>
                    </div>
                    <div>
                      <dt>Összes készlet</dt>
                      <dd className="text-white text-sm mt-1">{totalStock} DB</dd>
                    </div>
                    <div>
                      <dt>Max kedvezmény</dt>
                      <dd className="text-white text-sm mt-1">{maxDiscount}%</dd>
                    </div>
                  </dl>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              Adj meg opciókat, majd generáld a variánsokat.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
