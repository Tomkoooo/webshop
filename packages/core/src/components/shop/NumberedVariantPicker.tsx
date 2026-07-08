"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@wse/core/components/ui/input";
import { cn } from "@wse/core/lib/utils";
import {
  getActiveVariants,
  getVariantLabel,
  resolveProductView,
  type ProductShape,
  type VariantShape,
} from "@wse/core/lib/product-variants";
import {
  clampVatPercent,
  customerGrossFromNetWithDiscount,
  formatHuf,
  roundHuf,
} from "@wse/core/lib/pricing";
import { isNumberedVariantId, resolveNumberRangeChips, type NumberRangeChip } from "@wse/core/lib/numbered-variant-ranges";
import { getBaseVariant } from "@wse/core/lib/unique-numbered-variants";

const selectedPickerClass =
  "border-primary-foreground/35 bg-primary/10 text-primary-foreground";
const pickerClass = "border-border hover:border-primary-foreground/40";

function variantCustomerGross(product: ProductShape, variantId: string): number {
  const view = resolveProductView(product, variantId);
  const vat = clampVatPercent(product.vatPercent);
  return customerGrossFromNetWithDiscount(
    view.netPrice,
    view.discount ?? 0,
    vat,
    view.grossPrice
  );
}

function uniformGrossForVariants(
  product: ProductShape,
  variants: VariantShape[]
): number | null {
  if (variants.length === 0) return null;
  const grosses = variants.map((v) => roundHuf(variantCustomerGross(product, v.id)));
  const first = grosses[0];
  return grosses.every((g) => g === first) ? first : null;
}

function variantsInRange(
  variants: VariantShape[],
  chip: NumberRangeChip,
  attributeName: string
): VariantShape[] {
  return variants.filter((variant) => {
    const num = issueNumberFromVariant(variant, attributeName);
    return num != null && num >= chip.from && num <= chip.to;
  });
}

function issueNumberFromVariant(
  variant: { attributes?: Record<string, string> },
  attributeName: string
): number | null {
  const raw = variant.attributes?.[attributeName]?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

type Props = {
  product: ProductShape;
  attributeName?: string;
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
  compact?: boolean;
};

export function NumberedVariantPicker({
  product,
  attributeName = "Szám",
  selectedVariantId,
  onSelect,
  compact = false,
}: Props) {
  const [query, setQuery] = React.useState("");
  const [rangeFilter, setRangeFilter] = React.useState<{ from: number; to: number } | null>(null);

  const baseVariant = React.useMemo(() => getBaseVariant(product), [product]);
  const baseInStock = Boolean(baseVariant && (Number(baseVariant.stock) || 0) > 0);
  const baseLabel =
    baseVariant?.nameOverride?.trim() || "Általános példány (nem sorszámozott)";

  const numberedAvailable = React.useMemo(() => {
    return getActiveVariants(product).filter(
      (v) => isNumberedVariantId(v.id) && (Number(v.stock) || 0) > 0
    );
  }, [product]);

  const filtered = React.useMemo(() => {
    const q = query.trim();
    return numberedAvailable.filter((variant) => {
      const num = issueNumberFromVariant(variant, attributeName);
      if (rangeFilter && num != null) {
        if (num < rangeFilter.from || num > rangeFilter.to) return false;
      }
      if (!q) return true;
      if (num != null && String(num).includes(q)) return true;
      return getVariantLabel(variant).toLowerCase().includes(q.toLowerCase());
    });
  }, [numberedAvailable, query, rangeFilter, attributeName]);

  const attr = product.uniqueNumberedVariants?.attributeName?.trim() || attributeName;

  const rangeChips = React.useMemo(
    () =>
      resolveNumberRangeChips(
        product.uniqueNumberedVariants?.numberRanges,
        getActiveVariants(product),
        attr
      ),
    [product, attr]
  );

  const showPresetChips = numberedAvailable.length > 30 && rangeChips.length > 0;

  const chipUniformGross = React.useMemo(() => {
    const map = new Map<string, number | null>();
    for (const chip of rangeChips) {
      const inRange = variantsInRange(numberedAvailable, chip, attr);
      map.set(chip.label, uniformGrossForVariants(product, inRange));
    }
    return map;
  }, [rangeChips, numberedAvailable, product, attr]);

  const activeChipUniformGross = React.useMemo(() => {
    if (!rangeFilter) return null;
    const chip = rangeChips.find(
      (c) => c.from === rangeFilter.from && c.to === rangeFilter.to
    );
    if (!chip) return null;
    return chipUniformGross.get(chip.label) ?? null;
  }, [rangeFilter, rangeChips, chipUniformGross]);

  const showGrossOnNumberCards = React.useMemo(() => {
    if (rangeFilter) {
      return activeChipUniformGross == null;
    }
    return uniformGrossForVariants(product, numberedAvailable) == null;
  }, [rangeFilter, activeChipUniformGross, product, numberedAvailable]);

  const showNumberGrid = numberedAvailable.length > 0;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {baseInStock && baseVariant ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Vagy válassz alap példányt
          </p>
          <button
            type="button"
            onClick={() => onSelect(baseVariant.id)}
            className={cn(
              "w-full border px-4 py-3 text-left transition-colors",
              compact ? "text-xs" : "text-sm",
              selectedVariantId === baseVariant.id ? selectedPickerClass : pickerClass
            )}
          >
            <span className="font-semibold uppercase tracking-widest">{baseLabel}</span>
            <span
              className={cn(
                "mt-1 block text-[10px]",
                selectedVariantId === baseVariant.id
                  ? "text-primary-foreground/85"
                  : "text-muted-foreground"
              )}
            >
              Készlet: {Number(baseVariant.stock) || 0} db
            </span>
          </button>
        </div>
      ) : null}

      {showNumberGrid ? (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Egyedi sorszám ({numberedAvailable.length} elérhető)
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              inputMode="numeric"
              placeholder="Keresés sorszámra…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "pl-9 rounded-none border-border bg-background",
                compact ? "h-9 text-sm" : "h-11"
              )}
            />
          </div>

          {showPresetChips ? (
            <div className="flex flex-wrap gap-2">
              {rangeChips.map((chip) => {
                const isSelected =
                  rangeFilter?.from === chip.from && rangeFilter?.to === chip.to;
                const uniformGross = chipUniformGross.get(chip.label);
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() =>
                      setRangeFilter(
                        isSelected ? null : { from: chip.from, to: chip.to }
                      )
                    }
                    className={cn(
                      "border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors",
                      isSelected ? selectedPickerClass : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    <span className="block leading-tight">{chip.label}</span>
                    {uniformGross != null ? (
                      <span
                        className={cn(
                          "mt-0.5 block text-[9px] font-bold tabular-nums tracking-normal normal-case",
                          isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                        )}
                      >
                        {formatHuf(uniformGross)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div
            className={cn(
              "grid gap-2 max-h-64 overflow-y-auto pr-1",
              compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-5 sm:grid-cols-8 md:grid-cols-10"
            )}
          >
            {filtered.length === 0 ? (
              <p className="col-span-full text-xs text-muted-foreground py-4">
                Nincs elérhető sorszám a szűréshez.
              </p>
            ) : (
              filtered.map((variant) => {
                const num = issueNumberFromVariant(variant, attributeName);
                const label = num != null ? String(num) : getVariantLabel(variant);
                const isSelected = selectedVariantId === variant.id;
                const grossLabel = showGrossOnNumberCards
                  ? formatHuf(variantCustomerGross(product, variant.id))
                  : null;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => onSelect(variant.id)}
                    className={cn(
                      "border font-semibold tabular-nums transition-colors flex flex-col items-center justify-center gap-0.5",
                      grossLabel ? "min-h-11 py-1" : "min-h-9",
                      compact ? "text-xs px-1" : "text-sm px-2",
                      isSelected ? selectedPickerClass : pickerClass
                    )}
                  >
                    <span>{label}</span>
                    {grossLabel ? (
                      <span
                        className={cn(
                          "text-[8px] font-bold leading-none tracking-normal normal-case",
                          isSelected ? "text-primary-foreground/85" : "text-muted-foreground"
                        )}
                      >
                        {grossLabel}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
