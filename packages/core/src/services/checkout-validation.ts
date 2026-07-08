import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import Product from "@wse/core/models/Product";
import ShippingMethod from "@wse/core/models/ShippingMethod";
import PaymentMethod from "@wse/core/models/PaymentMethod";
import Coupon, { DiscountType } from "@wse/core/models/Coupon";
import {
  validateAndApplyCoupon,
} from "@wse/core/lib/coupon-validation";
import {
  resolveConfiguredGlsShippingMethod,
} from "@wse/core/services/gls-shipping";
import { resolveConfiguredFoxpostShippingMethod } from "@wse/core/services/foxpost-shipping";
import { FeatureFlagService } from "@wse/core/services/feature-flags";
import {
  isFoxpostParcelPickerEnabled,
  isGlsParcelPickerEnabled,
} from "@wse/core/lib/parcel-feature-flags";
import { GLS_FIXED_SHIPPING_METHOD_ID, GlsParcelPoint } from "@wse/core/lib/gls";
import { FOXPOST_FIXED_SHIPPING_METHOD_ID, FoxpostParcelPoint } from "@wse/core/lib/foxpost";
import { resolveFoxpostParcelPointForCheckout } from "@wse/core/lib/foxpost-apm-catalog";
import {
  buildFoxpostParcelOrderShippingAddress,
  buildGlsParcelOrderShippingAddress,
} from "@wse/core/lib/parcel-locker-checkout-display";
import { customerGrossFromNetWithDiscount, clampVatPercent, distributeCheckoutDiscountToItems, roundHuf } from "@wse/core/lib/pricing";
import {
  assertClientCartLinePrice,
  quoteCheckoutLineForQuantity,
} from "@wse/core/lib/limited-price-checkout";
import { ShopTradingSettingsService } from "@wse/core/services/shop-trading-settings";
import { getCartLineOrderabilityMessage } from "@wse/core/lib/cart-line-orderability";
import { isUniqueNumberedProduct, maxQuantityForCartLine } from "@wse/core/lib/unique-numbered-variants";
import {
  resolveCountryInput,
  formatAllowedCountriesList,
  normalizeIso2,
  getCountryDisplayName,
} from "@wse/core/lib/country-codes";

export const STRIPE_FIXED_PAYMENT_METHOD_ID = "stripe_fixed";

export type CheckoutInputItem = {
  product: string;
  variantId?: string;
  variantLabel?: string;
  selectedAttributes?: Record<string, string>;
  name?: string;
  price?: number;
  quantity: number;
  /** Set server-side only; ignored from client payloads. */
  vatPercent?: number;
};

export type CheckoutInput = {
  items: CheckoutInputItem[];
  billingInfo: {
    type: "personal" | "company";
    name: string;
    taxNumber?: string;
    country?: string;
    countryCode?: string;
    zip: string;
    city: string;
    street: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    name: string;
    country?: string;
    countryCode?: string;
    zip: string;
    city: string;
    street: string;
    comment?: string;
    email: string;
    phone: string;
  };
  shippingMethod: string;
  paymentMethod: string;
  glsParcelPoint?: GlsParcelPoint;
  foxpostParcelPoint?: FoxpostParcelPoint;
  couponCodes?: string[];
  subtotal?: number;
  shippingFee?: number;
  paymentFee?: number;
  discount?: number;
  total?: number;
  /** When true and `userId` is set, billing/shipping are copied to the user profile after order creation. */
  saveAddressToProfile?: boolean;
};

export type ValidatedCheckoutData = {
  items: CheckoutInputItem[];
  billingInfo: CheckoutInput["billingInfo"];
  shippingAddress: CheckoutInput["shippingAddress"];
  shippingMethod: string;
  paymentMethod: string;
  glsParcelPoint?: GlsParcelPoint;
  foxpostParcelPoint?: FoxpostParcelPoint;
  couponCodes: string[];
  subtotal: number;
  shippingFee: number;
  paymentFee: number;
  discount: number;
  total: number;
  paymentProvider: "stripe" | "standard";
  saveAddressToProfile: boolean;
  billingCountry: string;
  shippingCountry: string;
  billingCountryCode: string;
  shippingCountryCode: string;
};

export type CheckoutPriceAllocation = {
  promoQuantity?: number;
  regularQuantity?: number;
  promoUnitPrice?: number;
  regularUnitPrice?: number;
};

function roundCurrency(value: number): number {
  return Math.round(value);
}

export function applyCheckoutPriceAllocations<T extends ValidatedCheckoutData>(
  data: T,
  allocations: CheckoutPriceAllocation[]
): T {
  const nextItems: CheckoutInputItem[] = [];
  data.items.forEach((item, index) => {
    const allocation = allocations[index];
    const promoQuantity = Math.max(0, Math.round(Number(allocation?.promoQuantity || 0)));
    const regularQuantity = Math.max(
      0,
      Math.round(Number(allocation?.regularQuantity ?? item.quantity - promoQuantity))
    );
    if (!allocation || promoQuantity <= 0) {
      nextItems.push(item);
      return;
    }
    if (promoQuantity > 0) {
      nextItems.push({
        ...item,
        name: `${item.name || "Termék"} - limitált ár`,
        price: roundCurrency(Number(allocation.promoUnitPrice ?? item.price ?? 0)),
        quantity: promoQuantity,
      });
    }
    if (regularQuantity > 0) {
      nextItems.push({
        ...item,
        price: roundCurrency(Number(allocation.regularUnitPrice ?? item.price ?? 0)),
        quantity: regularQuantity,
      });
    }
  });

  const subtotal = roundCurrency(
    nextItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );
  const total = Math.max(
    0,
    roundCurrency(subtotal + Number(data.shippingFee || 0) + Number(data.paymentFee || 0) - Number(data.discount || 0))
  );
  return {
    ...data,
    items: nextItems,
    subtotal,
    total,
  };
}

function ensureString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Hiányzó vagy hibás mező: ${field}`);
  }
  return value.trim();
}

function resolveItemPrice(
  product: any,
  variantId?: string
): { unitPrice: number; variantLabel?: string; vatPercent: number } {
  const pct = clampVatPercent(product.vatPercent ?? 27)
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const requireVariantSelection = Boolean(product.requireVariantSelection) && hasVariants;

  if (variantId) {
    const variant = (product.variants || []).find((entry: any) => entry.id === variantId);
    if (!variant) {
      throw new Error(`Érvénytelen variáns: ${product.name}`);
    }
    if (variant.isActive === false) {
      throw new Error(`A kiválasztott variáns nem aktív: ${product.name}`);
    }
    return {
      unitPrice: customerGrossFromNetWithDiscount(
        Number(variant.netPrice || 0),
        Number(variant.discount || 0),
        pct,
        variant.grossPrice
      ),
      variantLabel: Object.entries(variant.attributes || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join(" / "),
      vatPercent: pct,
    };
  }

  if (requireVariantSelection) {
    throw new Error(`Válassz variánst a termékhez: ${product.name}`);
  }

  return {
    unitPrice: customerGrossFromNetWithDiscount(
      Number(product.netPrice || 0),
      Number(product.discount || 0),
      pct,
      product.grossPrice
    ),
    vatPercent: pct,
  };
}

async function validateCoupon(
  code: string | undefined,
  subtotal: number,
  userId?: string,
  items?: CheckoutInputItem[],
  email?: string
) {
  return validateAndApplyCoupon(code, subtotal, {
    userId,
    email,
    items: (items || []).map((item) => ({
      product: item.product,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price ?? 0,
      vatPercent: item.vatPercent,
    })),
  });
}

async function resolveStripePaymentMethodId(): Promise<string> {
  const existing = await PaymentMethod.findOne({ name: "Stripe (bankkártya)" }).lean();
  if (existing?._id) return existing._id.toString();
  const created = await PaymentMethod.create({
    name: "Stripe (bankkártya)",
    grossPrice: 0,
    isActive: false,
  });
  return created._id.toString();
}

function assertCountryPolicy(
  billingCode: string,
  shippingCode: string,
  trading: { shippingAllowedCountryCodes: string[]; invoicingAllowedCountryCodes: string[] }
) {
  const shipAllow = trading.shippingAllowedCountryCodes
  const invAllow = trading.invoicingAllowedCountryCodes

  if (invAllow.length > 0 && !invAllow.includes(billingCode)) {
    const readable = formatAllowedCountriesList(invAllow)
    throw new Error(
      `A számlázási ország (${getCountryDisplayName(billingCode, "hu-HU")}, ${billingCode}) nem engedélyezett. A bolt csak a következő országoknak állít ki számlát: ${readable}.`
    )
  }
  if (shipAllow.length > 0 && !shipAllow.includes(shippingCode)) {
    const readable = formatAllowedCountriesList(shipAllow)
    throw new Error(
      `A szállítási ország (${getCountryDisplayName(shippingCode, "hu-HU")}, ${shippingCode}) nem engedélyezett. A bolt csak a következő országokba szállít: ${readable}.`
    )
  }
}

function requireResolvedCountry(
  kindHu: string,
  props: { explicitCode?: string; freeText?: string }
): { code: string; label: string } {
  const fromExplicit = normalizeIso2(props.explicitCode)
  if (fromExplicit) {
    return { code: fromExplicit, label: getCountryDisplayName(fromExplicit, "hu-HU") }
  }
  const res = resolveCountryInput(props.freeText || "")
  if (res.code) {
    return { code: res.code, label: getCountryDisplayName(res.code, "hu-HU") }
  }
  const hint = res.suggestions
    .slice(0, 5)
    .map((s) => `${s.code} (${s.labelHu})`)
    .join("; ")
  throw new Error(
    `Nem sikerült egyértelműen azonosítani a(z) ${kindHu} országot. Add meg az ISO országkódot (pl. HU), vagy válassz a listából.${
      hint ? ` Javaslatok: ${hint}` : ""
    }`
  )
}

export async function validateAndNormalizeCheckoutInput(
  input: CheckoutInput,
  options?: { userId?: string; allowStripeFixed?: boolean }
): Promise<ValidatedCheckoutData> {
  await dbConnect();

  if (!input || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("A kosár üres");
  }

  const billingInfo = input.billingInfo || ({} as CheckoutInput["billingInfo"]);
  const shippingAddress = input.shippingAddress || ({} as CheckoutInput["shippingAddress"]);
  ensureString(billingInfo.name, "billingInfo.name");
  ensureString(billingInfo.zip, "billingInfo.zip");
  ensureString(billingInfo.city, "billingInfo.city");
  ensureString(billingInfo.street, "billingInfo.street");
  ensureString(billingInfo.email, "billingInfo.email");
  ensureString(billingInfo.phone, "billingInfo.phone");
  ensureString(shippingAddress.name, "shippingAddress.name");
  ensureString(shippingAddress.zip, "shippingAddress.zip");
  ensureString(shippingAddress.city, "shippingAddress.city");
  ensureString(shippingAddress.street, "shippingAddress.street");
  ensureString(shippingAddress.email, "shippingAddress.email");
  ensureString(shippingAddress.phone, "shippingAddress.phone");

  const isGlsFixed = input.shippingMethod === GLS_FIXED_SHIPPING_METHOD_ID;
  const isFoxpostFixed = input.shippingMethod === FOXPOST_FIXED_SHIPPING_METHOD_ID;
  let isGlsParcel = isGlsFixed;
  let isFoxpostParcel = isFoxpostFixed;
  let resolvedShippingMethodId = "";
  let shippingMethodGrossPrice = 0;
  if (isGlsFixed) {
    if (!(await isGlsParcelPickerEnabled())) {
      throw new Error("A kiválasztott szállítási mód nem támogatott");
    }
    const configuredGlsMethod = await resolveConfiguredGlsShippingMethod({ requireActive: true });
    if (!configuredGlsMethod) {
      throw new Error("A GLS szállítás jelenleg nem elérhető");
    }
    if (!input.glsParcelPoint?.id || !input.glsParcelPoint?.name) {
      throw new Error("A GLS csomagpont kiválasztása kötelező");
    }
    resolvedShippingMethodId = configuredGlsMethod.id;
    shippingMethodGrossPrice = configuredGlsMethod.grossPrice;
  } else if (isFoxpostFixed) {
    if (!(await isFoxpostParcelPickerEnabled())) {
      throw new Error("A kiválasztott szállítási mód nem támogatott");
    }
    const configuredFoxpostMethod = await resolveConfiguredFoxpostShippingMethod({ requireActive: true });
    if (!configuredFoxpostMethod) {
      throw new Error("A Foxpost szállítás jelenleg nem elérhető");
    }
    if (!input.foxpostParcelPoint?.id || !input.foxpostParcelPoint?.name) {
      throw new Error("A Foxpost csomagautomata kiválasztása kötelező");
    }
    resolvedShippingMethodId = configuredFoxpostMethod.id;
    shippingMethodGrossPrice = configuredFoxpostMethod.grossPrice;
  } else {
    if (!mongoose.Types.ObjectId.isValid(input.shippingMethod)) {
      throw new Error("Érvénytelen szállítási mód");
    }
    const shippingMethod = await ShippingMethod.findOne({
      _id: input.shippingMethod,
      isActive: true,
    }).lean();
    if (!shippingMethod) {
      throw new Error("A kiválasztott szállítási mód nem elérhető");
    }
    const provider = (shippingMethod as { provider?: string }).provider || "standard";
    if (provider === "gls") {
      if (!(await isGlsParcelPickerEnabled())) {
        throw new Error("A kiválasztott szállítási mód nem támogatott");
      }
      if (!input.glsParcelPoint?.id || !input.glsParcelPoint?.name) {
        throw new Error("A GLS csomagpont kiválasztása kötelező");
      }
      isGlsParcel = true;
    } else if (provider === "foxpost") {
      if (!(await isFoxpostParcelPickerEnabled())) {
        throw new Error("A kiválasztott szállítási mód nem támogatott");
      }
      if (!input.foxpostParcelPoint?.id || !input.foxpostParcelPoint?.name) {
        throw new Error("A Foxpost csomagautomata kiválasztása kötelező");
      }
      isFoxpostParcel = true;
    }
    resolvedShippingMethodId = shippingMethod._id.toString();
    shippingMethodGrossPrice = Number(shippingMethod.grossPrice || 0);
  }

  const isStripeFixed = input.paymentMethod === STRIPE_FIXED_PAYMENT_METHOD_ID;
  if (isStripeFixed && !options?.allowStripeFixed) {
    throw new Error("A kiválasztott fizetési mód nem támogatott");
  }

  let resolvedFoxpostParcelPoint: FoxpostParcelPoint | undefined;
  if (isFoxpostParcel && input.foxpostParcelPoint) {
    resolvedFoxpostParcelPoint = await resolveFoxpostParcelPointForCheckout(input.foxpostParcelPoint, {
      forceRefresh: true,
    });
  }

  let paymentMethodId = "";
  let paymentFee = 0;
  if (isStripeFixed) {
    paymentMethodId = await resolveStripePaymentMethodId();
  } else {
    if (!mongoose.Types.ObjectId.isValid(input.paymentMethod)) {
      throw new Error("Érvénytelen fizetési mód");
    }
    const paymentMethod = await PaymentMethod.findOne({
      _id: input.paymentMethod,
      isActive: true,
    }).lean();
    if (!paymentMethod) {
      throw new Error("A kiválasztott fizetési mód nem elérhető");
    }
    paymentMethodId = paymentMethod._id.toString();
    paymentFee = Number(paymentMethod.grossPrice || 0);
  }

  const normalizedItems: CheckoutInputItem[] = [];
  const priceAllocations: CheckoutPriceAllocation[] = [];
  let subtotal = 0;

  for (const item of input.items) {
    if (!item || !mongoose.Types.ObjectId.isValid(item.product)) {
      throw new Error("Érvénytelen termék a kosárban");
    }
    const quantity = Number(item.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Érvénytelen mennyiség a kosárban");
    }

    const product = await Product.findById(item.product).lean();
    if (!product) throw new Error("A kosár egyik terméke már nem található");
    if (!product.isActive || !product.isVisible) {
      throw new Error(`${product.name} jelenleg nem rendelhető`);
    }

    const orderability = getCartLineOrderabilityMessage(
      {
        productId: item.product,
        variantId: item.variantId,
        quantity,
        name: item.name,
      },
      product as Parameters<typeof getCartLineOrderabilityMessage>[1]
    );
    if (orderability) throw new Error(orderability);

    if (isUniqueNumberedProduct(product)) {
      const cap = maxQuantityForCartLine(
        product,
        item.variantId
          ? (product as { variants?: { id: string; stock?: number }[] }).variants?.find(
              (v) => v.id === item.variantId
            )?.stock
          : product.stock,
        item.variantId
      );
      if (quantity > cap) {
        throw new Error(`Ehhez a sorszámhoz legfeljebb ${cap} db rendelhető.`);
      }
    }

    const priceInfo = resolveItemPrice(product, item.variantId);
    const quote = quoteCheckoutLineForQuantity(product, item.variantId, quantity);
    assertClientCartLinePrice(item.price, quantity, quote);
    subtotal += quote.lineTotal;
    priceAllocations.push({
      promoQuantity: quote.promoQuantity,
      regularQuantity: quote.regularQuantity,
      promoUnitPrice: quote.promoUnitPrice,
      regularUnitPrice: quote.regularUnitPrice,
    });

    normalizedItems.push({
      product: item.product,
      variantId: item.variantId || undefined,
      variantLabel: item.variantLabel || priceInfo.variantLabel || undefined,
      selectedAttributes: item.selectedAttributes || undefined,
      name: item.name || product.name,
      price: quote.regularUnitPrice,
      quantity,
      vatPercent: quote.vatPercent,
    });
  }

  let pricedCheckout: ValidatedCheckoutData = {
    items: normalizedItems,
    billingInfo: billingInfo as CheckoutInput["billingInfo"],
    shippingAddress: shippingAddress as CheckoutInput["shippingAddress"],
    shippingMethod: resolvedShippingMethodId,
    paymentMethod: paymentMethodId,
    glsParcelPoint: undefined,
    foxpostParcelPoint: undefined,
    couponCodes: [],
    subtotal: roundCurrency(subtotal),
    shippingFee: 0,
    paymentFee: roundCurrency(paymentFee),
    discount: 0,
    total: 0,
    paymentProvider: isStripeFixed ? "stripe" : "standard",
    saveAddressToProfile: false,
    billingCountry: "",
    shippingCountry: "",
    billingCountryCode: "",
    shippingCountryCode: "",
  };
  pricedCheckout = applyCheckoutPriceAllocations(pricedCheckout, priceAllocations);

  const couponCode = Array.isArray(input.couponCodes) ? input.couponCodes[0] : undefined;
  const originalSubtotal = pricedCheckout.subtotal;
  const couponResult = await validateCoupon(
    couponCode,
    originalSubtotal,
    options?.userId,
    pricedCheckout.items,
    billingInfo.email
  );

  if (couponResult.type === DiscountType.PRODUCT_PRICE && couponResult.adjustedLines) {
    pricedCheckout.items = pricedCheckout.items.map((item, index) => ({
      ...item,
      price: couponResult.adjustedLines![index]?.price ?? item.price,
    }));
    pricedCheckout.subtotal = couponResult.adjustedSubtotal ?? pricedCheckout.subtotal;
  }

  const shippingFee = couponResult.freeShipping ? 0 : shippingMethodGrossPrice;
  const discount = Math.max(0, couponResult.discount);
  const isCartWideCoupon =
    couponResult.type === DiscountType.PERCENTAGE ||
    couponResult.type === DiscountType.FIXED_AMOUNT;

  if (isCartWideCoupon && discount > 0) {
    pricedCheckout.items = distributeCheckoutDiscountToItems(
      pricedCheckout.items,
      discount
    ) as typeof pricedCheckout.items;
    pricedCheckout.subtotal = roundHuf(
      pricedCheckout.items.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      )
    );
  }

  const total = Math.max(0, roundCurrency(pricedCheckout.subtotal + shippingFee + paymentFee));

  const billingResolved = requireResolvedCountry("számlázási", {
    explicitCode: billingInfo.countryCode?.trim(),
    freeText:
      billingInfo.country?.trim() ||
      billingInfo.countryCode?.trim() ||
      "Magyarország",
  })

  let shippingResolved: { code: string; label: string }
  if (isGlsParcel && input.glsParcelPoint?.contact?.countryCode) {
    shippingResolved = requireResolvedCountry("szállítási (GLS csomagpont)", {
      explicitCode: input.glsParcelPoint.contact.countryCode.trim(),
      freeText: undefined,
    })
  } else if (isFoxpostParcel && resolvedFoxpostParcelPoint?.countryCode) {
    shippingResolved = requireResolvedCountry("szállítási (Foxpost)", {
      explicitCode: resolvedFoxpostParcelPoint.countryCode.trim(),
      freeText: undefined,
    })
  } else if (isGlsParcel || isFoxpostParcel) {
    shippingResolved = billingResolved
  } else {
    shippingResolved = requireResolvedCountry("szállítási", {
      explicitCode: shippingAddress.countryCode?.trim(),
      freeText:
        shippingAddress.country?.trim() ||
        shippingAddress.countryCode?.trim() ||
        billingResolved.label,
    })
  }

  const trading = await ShopTradingSettingsService.get()
  assertCountryPolicy(billingResolved.code, shippingResolved.code, trading)

  const parcelShippingContact = {
    name: shippingAddress.name.trim(),
    email: shippingAddress.email.trim(),
    phone: shippingAddress.phone.trim(),
    comment: shippingAddress.comment?.trim() || undefined,
  }

  const normalizedShippingAddress =
    isGlsParcel && input.glsParcelPoint
      ? buildGlsParcelOrderShippingAddress(
          parcelShippingContact,
          input.glsParcelPoint,
          shippingResolved
        )
      : isFoxpostParcel && resolvedFoxpostParcelPoint
        ? buildFoxpostParcelOrderShippingAddress(
            parcelShippingContact,
            resolvedFoxpostParcelPoint,
            shippingResolved
          )
        : {
            name: shippingAddress.name.trim(),
            country: shippingResolved.label,
            countryCode: shippingResolved.code,
            zip: shippingAddress.zip.trim(),
            city: shippingAddress.city.trim(),
            street: shippingAddress.street.trim(),
            comment: shippingAddress.comment?.trim() || undefined,
            email: shippingAddress.email.trim(),
            phone: shippingAddress.phone.trim(),
          }

  const saveAddressToProfile =
    Boolean(options?.userId) &&
    input.saveAddressToProfile !== false &&
    !isGlsParcel &&
    !isFoxpostParcel

  return {
    items: pricedCheckout.items,
    billingInfo: {
      type: billingInfo.type === "company" ? "company" : "personal",
      name: billingInfo.name.trim(),
      taxNumber: billingInfo.taxNumber?.trim() || undefined,
      country: billingResolved.label,
      countryCode: billingResolved.code,
      zip: billingInfo.zip.trim(),
      city: billingInfo.city.trim(),
      street: billingInfo.street.trim(),
      email: billingInfo.email.trim(),
      phone: billingInfo.phone.trim(),
    },
    shippingAddress: normalizedShippingAddress,
    shippingMethod: resolvedShippingMethodId,
    paymentMethod: paymentMethodId,
    glsParcelPoint: isGlsParcel
      ? {
          id: ensureString(input.glsParcelPoint?.id, "glsParcelPoint.id"),
          name: ensureString(input.glsParcelPoint?.name, "glsParcelPoint.name"),
          contact: input.glsParcelPoint?.contact
            ? {
                countryCode: input.glsParcelPoint.contact.countryCode?.trim() || undefined,
                postalCode: input.glsParcelPoint.contact.postalCode?.trim() || undefined,
                city: input.glsParcelPoint.contact.city?.trim() || undefined,
                address: input.glsParcelPoint.contact.address?.trim() || undefined,
                name: input.glsParcelPoint.contact.name?.trim() || undefined,
                email: input.glsParcelPoint.contact.email?.trim() || undefined,
              }
            : undefined,
        }
      : undefined,
    foxpostParcelPoint: isFoxpostParcel && resolvedFoxpostParcelPoint
      ? {
          id: resolvedFoxpostParcelPoint.id,
          name: resolvedFoxpostParcelPoint.name,
          address: resolvedFoxpostParcelPoint.address,
          zip: resolvedFoxpostParcelPoint.zip,
          city: resolvedFoxpostParcelPoint.city,
          findme: resolvedFoxpostParcelPoint.findme,
          load: resolvedFoxpostParcelPoint.load,
        }
      : undefined,
    couponCodes: couponResult.couponCodes,
    subtotal: pricedCheckout.subtotal,
    shippingFee: roundCurrency(shippingFee),
    paymentFee: roundCurrency(paymentFee),
    discount,
    total,
    paymentProvider: isStripeFixed ? "stripe" : "standard",
    saveAddressToProfile,
    billingCountry: billingResolved.label,
    shippingCountry: shippingResolved.label,
    billingCountryCode: billingResolved.code,
    shippingCountryCode: shippingResolved.code,
  };
}
