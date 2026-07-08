/** Inclusive integer range for bulk numbered variant generation. */
export type NumberRange = {
  from: number;
  to: number;
  /** Numbers to skip within this range (inclusive bounds still apply). */
  exclude?: number[];
};

export const DEFAULT_NUMBERED_ATTRIBUTE_NAME = "Szám";

/** ELADHATÓ preset: 36–46 (11), 49–76 (27), 79–409 (331) = 369 numbers. */
export const ELADHATO_NUMBER_RANGES: NumberRange[] = [
  { from: 36, to: 46 },
  { from: 49, to: 76, exclude: [50] },
  { from: 79, to: 409 },
];

const MAX_EXPANDED_NUMBERS = 2000;

function normalizeRange(range: NumberRange): NumberRange {
  const from = Math.round(Number(range.from));
  const to = Math.round(Number(range.to));
  const exclude = Array.isArray(range.exclude)
    ? range.exclude.map((n) => Math.round(Number(n))).filter((n) => Number.isFinite(n))
    : [];
  return { from: Math.min(from, to), to: Math.max(from, to), exclude };
}

/** Expand ranges into sorted unique integers. */
export function expandNumberRanges(
  ranges: NumberRange[],
  globalExclude: number[] = []
): number[] {
  const excluded = new Set(
    globalExclude.map((n) => Math.round(Number(n))).filter((n) => Number.isFinite(n))
  );
  const numbers = new Set<number>();

  for (const raw of ranges) {
    const range = normalizeRange(raw);
    const localExclude = new Set(range.exclude ?? []);
    for (let n = range.from; n <= range.to; n += 1) {
      if (localExclude.has(n) || excluded.has(n)) continue;
      numbers.add(n);
    }
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  if (sorted.length > MAX_EXPANDED_NUMBERS) {
    throw new Error(`Túl sok sorszám (${sorted.length}); maximum ${MAX_EXPANDED_NUMBERS}.`);
  }
  return sorted;
}

export const NUMBERED_VARIANT_ID_PREFIX = "num-";

export function isNumberedVariantId(id: string): boolean {
  return String(id || "").startsWith(NUMBERED_VARIANT_ID_PREFIX);
}

export function variantIdForNumber(n: number): string {
  return `${NUMBERED_VARIANT_ID_PREFIX}${n}`;
}

export function issueNumberFromVariantId(id: string): number | null {
  if (!isNumberedVariantId(id)) return null;
  const n = Number(id.slice(NUMBERED_VARIANT_ID_PREFIX.length));
  return Number.isFinite(n) ? n : null;
}

/** Remove numbered variants (all or those in ranges). Non-numbered variants are kept. */
export function removeNumberedVariants<T extends { id: string }>(
  variants: T[],
  options: { all?: boolean; ranges?: NumberRange[]; globalExclude?: number[] }
): T[] {
  if (options.all) {
    return variants.filter((v) => !isNumberedVariantId(v.id));
  }
  if (!options.ranges?.length) return variants;
  const toRemove = new Set(
    expandNumberRanges(options.ranges, options.globalExclude ?? []).map((n) => variantIdForNumber(n))
  );
  return variants.filter((v) => !toRemove.has(v.id));
}

export function rebuildNumberedVariantOptions(
  variants: Array<{ id: string; attributes?: Record<string, string> }>,
  attributeName: string
): { name: string; values: string[] }[] {
  const name = attributeName.trim() || DEFAULT_NUMBERED_ATTRIBUTE_NAME;
  const values = variants
    .filter((v) => isNumberedVariantId(v.id))
    .map((v) => v.attributes?.[name]?.trim())
    .filter((v): v is string => Boolean(v))
    .sort((a, b) => Number(a) - Number(b));
  if (values.length === 0) return [];
  return [{ name, values }];
}

export function countNumberedVariants(variants: Array<{ id: string }>): number {
  return variants.filter((v) => isNumberedVariantId(v.id)).length;
}

/** Set `isActive` on all numbered variants, or only those in the given ranges. */
export function setNumberedVariantsActive<T extends { id: string; isActive?: boolean }>(
  variants: T[],
  isActive: boolean,
  options: { all?: boolean; ranges?: NumberRange[]; globalExclude?: number[] } = { all: true }
): T[] {
  if (options.all) {
    return variants.map((v) =>
      isNumberedVariantId(v.id) ? { ...v, isActive } : v
    );
  }
  if (!options.ranges?.length) return variants;
  const ids = new Set(
    expandNumberRanges(options.ranges, options.globalExclude ?? []).map((n) =>
      variantIdForNumber(n)
    )
  );
  return variants.map((v) => (ids.has(v.id) ? { ...v, isActive } : v));
}

export function buildNumberedVariantRecords(
  numbers: number[],
  options: {
    attributeName?: string;
    netPrice: number;
    grossPrice?: number;
    discount?: number;
    stock?: number;
    existingById?: Map<string, { stock?: number; isActive?: boolean }>;
  }
) {
  const attributeName = String(options.attributeName || DEFAULT_NUMBERED_ATTRIBUTE_NAME).trim() || DEFAULT_NUMBERED_ATTRIBUTE_NAME;
  const stockDefault = options.stock ?? 1;
  const existing = options.existingById ?? new Map();

  return numbers.map((n) => {
    const id = variantIdForNumber(n);
    const prev = existing.get(id);
    return {
      id,
      slugPart: id,
      attributes: { [attributeName]: String(n) },
      netPrice: options.netPrice,
      grossPrice: options.grossPrice,
      discount: options.discount ?? 0,
      stock: prev?.stock ?? stockDefault,
      isActive: prev?.isActive !== false,
      isDefault: false,
    };
  });
}

export function buildVariantOptionsForNumbers(numbers: number[], attributeName = DEFAULT_NUMBERED_ATTRIBUTE_NAME) {
  const name = attributeName.trim() || DEFAULT_NUMBERED_ATTRIBUTE_NAME;
  return [
    {
      name,
      values: numbers.map(String),
    },
  ];
}

export function countEladhatoPreset(): number {
  return expandNumberRanges(ELADHATO_NUMBER_RANGES).length;
}

export type NumberRangeChip = { label: string; from: number; to: number };

export function formatNumberRangeLabel(range: NumberRange): string {
  const normalized = normalizeRange(range);
  return normalized.from === normalized.to
    ? String(normalized.from)
    : `${normalized.from}–${normalized.to}`;
}

export function numberRangesToChips(ranges: NumberRange[]): NumberRangeChip[] {
  return ranges.map((range) => {
    const normalized = normalizeRange(range);
    return {
      label: formatNumberRangeLabel(normalized),
      from: normalized.from,
      to: normalized.to,
    };
  });
}

/** Build inclusive ranges from sorted issue numbers (consecutive runs). */
export function inferNumberRangesFromIssueNumbers(numbers: number[]): NumberRange[] {
  const sorted = [...new Set(numbers.filter((n) => Number.isFinite(n)))].sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const ranges: NumberRange[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    const n = sorted[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    ranges.push({ from: start, to: prev });
    start = n;
    prev = n;
  }
  ranges.push({ from: start, to: prev });
  return ranges;
}

export function resolveNumberRangeChips(
  storedRanges: NumberRange[] | undefined | null,
  variants: Array<{ id: string; attributes?: Record<string, string> }>,
  attributeName: string
): NumberRangeChip[] {
  if (Array.isArray(storedRanges) && storedRanges.length > 0) {
    return numberRangesToChips(storedRanges);
  }
  const numbers = variants
    .filter((v) => isNumberedVariantId(v.id))
    .map((v) => Number(String(v.attributes?.[attributeName] ?? "").trim()))
    .filter((n) => Number.isFinite(n));
  return numberRangesToChips(inferNumberRangesFromIssueNumbers(numbers));
}
