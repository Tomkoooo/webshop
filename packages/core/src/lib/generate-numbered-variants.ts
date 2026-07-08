import {
  buildNumberedVariantRecords,
  buildVariantOptionsForNumbers,
  expandNumberRanges,
  type NumberRange,
} from "@wse/core/lib/numbered-variant-ranges";
import { applyNumberedDescriptionTemplate } from "@wse/core/lib/unique-numbered-variants";
import type { IProductVariant } from "@wse/core/models/Product";

export type GenerateNumberedVariantsInput = {
  ranges: NumberRange[];
  globalExclude?: number[];
  attributeName?: string;
  netPrice: number;
  grossPrice?: number;
  discount?: number;
  initialStock?: number;
  descriptionHtml?: string;
};

export function mergeNumberedVariantsIntoExisting(
  existingVariants: IProductVariant[],
  input: GenerateNumberedVariantsInput
): { variants: IProductVariant[]; variantOptions: { name: string; values: string[] }[]; numbers: number[] } {
  const numbers = expandNumberRanges(input.ranges, input.globalExclude ?? []);
  const attributeName = String(input.attributeName || "Szám").trim() || "Szám";
  const existingById = new Map(
    existingVariants.map((v) => [v.id, { stock: v.stock, isActive: v.isActive }])
  );
  const generated = buildNumberedVariantRecords(numbers, {
    attributeName,
    netPrice: input.netPrice,
    grossPrice: input.grossPrice,
    discount: input.discount,
    stock: input.initialStock ?? 1,
    existingById,
  });

  const byId = new Map<string, IProductVariant>();
  for (const variant of existingVariants) {
    byId.set(variant.id, variant);
  }
  for (const row of generated) {
    const prev = byId.get(row.id);
    const descriptionOverride =
      prev?.descriptionOverride ||
      (input.descriptionHtml?.trim()
        ? applyNumberedDescriptionTemplate(
            input.descriptionHtml,
            row.attributes as Record<string, string>,
            attributeName
          )
        : undefined);
    byId.set(row.id, {
      ...(prev as IProductVariant | undefined),
      ...row,
      limitedPrice: prev?.limitedPrice,
      seo: prev?.seo,
      images: prev?.images,
      sku: prev?.sku,
      nameOverride: prev?.nameOverride,
      descriptionOverride,
    } as IProductVariant);
  }

  const variants = numbers.map((n) => byId.get(`num-${n}`)).filter(Boolean) as IProductVariant[];
  return {
    variants,
    variantOptions: buildVariantOptionsForNumbers(numbers, attributeName),
    numbers,
  };
}
