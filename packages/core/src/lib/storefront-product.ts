import { toPlainObject } from "@wse/core/lib/to-plain-object";

type VariantLike = {
  id?: string
  isActive?: boolean
  attributes?: Record<string, string>
}

type VariantOptionLike = {
  name: string
  values: string[]
}

/** Keep only variants customers may select (active flag). */
export function activeStorefrontVariants<T extends VariantLike>(variants: T[] | undefined | null): T[] {
  if (!Array.isArray(variants)) return []
  return variants.filter((variant) => variant.isActive !== false)
}

/** Restrict option lists to values that still map to an active variant. */
export function activeStorefrontVariantOptions(
  variantOptions: VariantOptionLike[] | undefined | null,
  variants: VariantLike[] | undefined | null
): VariantOptionLike[] {
  const active = activeStorefrontVariants(variants)
  if (!Array.isArray(variantOptions) || variantOptions.length === 0) return []
  if (active.length === 0) return []

  return variantOptions
    .map((option) => {
      const name = String(option.name || "").trim()
      if (!name) return null
      const values = (option.values || [])
        .map((value) => String(value || "").trim())
        .filter((value) =>
          active.some((variant) => String(variant.attributes?.[name] || "").trim() === value)
        )
      if (values.length === 0) return null
      return { name, values }
    })
    .filter((option): option is VariantOptionLike => option != null)
}

/** Strip inactive variants/options before passing product data to client components. */
export function toStorefrontProduct<T extends Record<string, unknown>>(product: T): T {
  const variants = activeStorefrontVariants(
    product.variants as VariantLike[] | undefined
  ) as T["variants"]
  const variantOptions = activeStorefrontVariantOptions(
    product.variantOptions as VariantOptionLike[] | undefined,
    variants as VariantLike[] | undefined
  ) as T["variantOptions"]

  return toPlainObject({
    ...product,
    variants,
    variantOptions,
  });
}
