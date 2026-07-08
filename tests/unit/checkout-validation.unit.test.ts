import { beforeEach, describe, expect, it, vi } from "vitest";

const dbConnectMock = vi.fn();
const productFindByIdMock = vi.fn();
const shippingFindOneMock = vi.fn();
const paymentFindOneMock = vi.fn();
const paymentCreateMock = vi.fn();
const couponFindOneMock = vi.fn();
const orderCountDocumentsMock = vi.fn();
const resolveGlsMethodMock = vi.fn();
const resolveFoxpostMethodMock = vi.fn();
const flagEnabledMock = vi.fn();

const resolveFoxpostParcelPointForCheckoutMock = vi.fn(
  async (point: { id?: string; name?: string; zip?: string; city?: string; address?: string }) => point
);

vi.mock("@wse/core/lib/foxpost-apm-catalog", () => ({
  resolveFoxpostParcelPointForCheckout: (...args: unknown[]) =>
    resolveFoxpostParcelPointForCheckoutMock(...args),
}));
vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/Product", () => ({ default: { findById: productFindByIdMock } }));
vi.mock("@wse/core/models/ShippingMethod", () => ({ default: { findOne: shippingFindOneMock } }));
vi.mock("@wse/core/models/PaymentMethod", () => ({
  default: { findOne: paymentFindOneMock, create: paymentCreateMock },
}));
vi.mock("@wse/core/models/Coupon", () => ({
  default: { findOne: couponFindOneMock },
  DiscountType: {
    FREE_SHIPPING: "free_shipping",
    PERCENTAGE: "percentage",
    FIXED_AMOUNT: "fixed_amount",
    PRODUCT_PRICE: "product_price",
  },
}));
vi.mock("@wse/core/models/Order", () => ({
  default: { countDocuments: orderCountDocumentsMock },
}));
vi.mock("@wse/core/services/gls-shipping", () => ({ resolveConfiguredGlsShippingMethod: resolveGlsMethodMock }));
vi.mock("@wse/core/services/foxpost-shipping", () => ({
  resolveConfiguredFoxpostShippingMethod: resolveFoxpostMethodMock,
}));
vi.mock("@wse/core/services/shop-trading-settings", () => ({
  ShopTradingSettingsService: {
    get: vi.fn().mockResolvedValue({
      shippingAllowedCountryCodes: [],
      invoicingAllowedCountryCodes: [],
    }),
  },
}));
vi.mock("@wse/core/services/feature-flags", () => ({ FeatureFlagService: { isEnabled: flagEnabledMock } }));

describe("checkout-validation unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveFoxpostParcelPointForCheckoutMock.mockImplementation(async (point) => point);
    productFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "p1",
        name: "Termek",
        isActive: true,
        isVisible: true,
        netPrice: 1000,
        discount: 0,
        stock: 10,
        variants: [],
      }),
    });
    shippingFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: { toString: () => "ship1" }, grossPrice: 999 }) });
    paymentFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: { toString: () => "pay1" }, grossPrice: 0 }) });
    couponFindOneMock.mockResolvedValue(null);
    orderCountDocumentsMock.mockResolvedValue(0);
    flagEnabledMock.mockResolvedValue(true);
    resolveGlsMethodMock.mockResolvedValue({ id: "ship_gls", grossPrice: 1200 });
    resolveFoxpostMethodMock.mockResolvedValue({ id: "ship_fox", grossPrice: 990 });
    paymentCreateMock.mockResolvedValue({ _id: { toString: () => "stripe-db-id" } });
  });

  it("validates standard payload", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    const result = await validateAndNormalizeCheckoutInput({
      items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
      billingInfo: {
        type: "personal",
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingAddress: {
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingMethod: "507f1f77bcf86cd799439012",
      paymentMethod: "507f1f77bcf86cd799439013",
    });

    expect(result.shippingMethod).toBe("ship1");
    expect(result.paymentMethod).toBe("pay1");
    expect(result.paymentProvider).toBe("standard");
    expect(result.saveAddressToProfile).toBe(false);
    expect(result.billingCountry).toBe("Magyarország");
    expect(result.shippingCountry).toBe("Magyarország");
  });

  it("defaults saveAddressToProfile on for authenticated checkout", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    const uid = "507f1f77bcf86cd799439099";
    const result = await validateAndNormalizeCheckoutInput(
      {
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
          country: "  RO  ",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "2222",
          city: "Deb",
          street: "Ut 2",
          email: "a@a.com",
          phone: "222",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "507f1f77bcf86cd799439013",
      },
      { userId: uid }
    );
    expect(result.saveAddressToProfile).toBe(true);
    expect(result.billingCountryCode).toBe("RO");
    expect(result.shippingCountryCode).toBe("RO");
  });

  it("honours saveAddressToProfile false for authenticated checkout", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    const result = await validateAndNormalizeCheckoutInput(
      {
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "507f1f77bcf86cd799439013",
        saveAddressToProfile: false,
      },
      { userId: "507f1f77bcf86cd799439099" }
    );
    expect(result.saveAddressToProfile).toBe(false);
  });

  it("persists GLS parcel point for admin-configured shipping method (provider gls)", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    shippingFindOneMock.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        _id: { toString: () => "ship_gls_db" },
        grossPrice: 1490,
        provider: "gls",
      }),
    });
    const result = await validateAndNormalizeCheckoutInput({
      items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
      billingInfo: {
        type: "personal",
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingAddress: {
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingMethod: "507f1f77bcf86cd799439012",
      paymentMethod: "507f1f77bcf86cd799439013",
      glsParcelPoint: {
        id: "gls-point-99",
        name: "GLS ABC",
        contact: { postalCode: "4024", city: "Debrecen", address: "Piac u. 1" },
      },
    });
    expect(result.shippingMethod).toBe("ship_gls_db");
    expect(result.glsParcelPoint?.id).toBe("gls-point-99");
    expect(result.glsParcelPoint?.name).toBe("GLS ABC");
    expect(result.foxpostParcelPoint).toBeUndefined();
    expect(result.shippingAddress.zip).toBe("4024");
    expect(result.shippingAddress.city).toBe("Debrecen");
    expect(result.shippingAddress.street).toBe("Piac u. 1");
    expect(result.shippingAddress.name).toBe("Teszt");
  });

  it("uses Foxpost automata address on order and keeps automata id", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    shippingFindOneMock.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        _id: { toString: () => "ship_fox_db" },
        grossPrice: 990,
        provider: "foxpost",
      }),
    });
    const result = await validateAndNormalizeCheckoutInput(
      {
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt Vevo",
          zip: "1111",
          city: "Bp",
          street: "Otthoni ut 9",
          email: "vevo@a.com",
          phone: "+36201234567",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "507f1f77bcf86cd799439013",
        foxpostParcelPoint: {
          id: "hu5516",
          name: "Fox ABC",
          zip: "4028",
          city: "Debrecen",
          address: "Automata utca 5",
        },
      },
      { userId: "507f1f77bcf86cd799439099" }
    );
    expect(result.foxpostParcelPoint?.id).toBe("hu5516");
    expect(result.shippingAddress.zip).toBe("4028");
    expect(result.shippingAddress.city).toBe("Debrecen");
    expect(result.shippingAddress.street).toBe("Automata utca 5");
    expect(result.shippingAddress.name).toBe("Teszt Vevo");
    expect(result.shippingAddress.email).toBe("vevo@a.com");
    expect(result.saveAddressToProfile).toBe(false);
  });

  it("validates GLS fixed path and requires parcel point", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "gls_fixed",
        paymentMethod: "507f1f77bcf86cd799439013",
      })
    ).rejects.toThrow("A GLS csomagpont kiválasztása kötelező");
  });

  it("validates Foxpost fixed path and requires parcel point", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "foxpost_fixed",
        paymentMethod: "507f1f77bcf86cd799439013",
      })
    ).rejects.toThrow("A Foxpost csomagautomata kiválasztása kötelező");
  });

  it("resolves Foxpost fixed shipping with parcel point", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    const result = await validateAndNormalizeCheckoutInput({
      items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
      billingInfo: {
        type: "personal",
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingAddress: {
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingMethod: "foxpost_fixed",
      paymentMethod: "507f1f77bcf86cd799439013",
      foxpostParcelPoint: {
        id: "hu5516",
        name: "Fox automata",
        zip: "4028",
        city: "Debrecen",
        address: "Automata utca 5",
      },
    });
    expect(result.shippingMethod).toBe("ship_fox");
    expect(result.foxpostParcelPoint?.id).toBe("hu5516");
    expect(result.shippingAddress.street).toBe("Automata utca 5");
    expect(result.shippingAddress.city).toBe("Debrecen");
  });

  it("supports stripe fixed payment path", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    paymentFindOneMock.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) });
    const result = await validateAndNormalizeCheckoutInput(
      {
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "stripe_fixed",
      },
      { allowStripeFixed: true }
    );
    expect(result.paymentProvider).toBe("stripe");
    expect(result.paymentMethod).toBe("stripe-db-id");
  });

  it("rejects stripe fixed when allow flag is false", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "stripe_fixed",
      })
    ).rejects.toThrow("A kiválasztott fizetési mód nem támogatott");
  });

  it("rejects invalid shipping and payment method IDs", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "x",
        paymentMethod: "y",
      })
    ).rejects.toThrow("Érvénytelen szállítási mód");
  });

  it("rejects when shipping method is unavailable", async () => {
    shippingFindOneMock.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) });
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "507f1f77bcf86cd799439013",
      })
    ).rejects.toThrow("A kiválasztott szállítási mód nem elérhető");
  });

  it("rejects when payment method is unavailable", async () => {
    paymentFindOneMock.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) });
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "507f1f77bcf86cd799439013",
      })
    ).rejects.toThrow("A kiválasztott fizetési mód nem elérhető");
  });

  it("applies product price coupon to matching lines", async () => {
    productFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        name: "Termek",
        isActive: true,
        isVisible: true,
        netPrice: 1000,
        grossPrice: 1270,
        discount: 0,
        vatPercent: 27,
        stock: 10,
        variants: [],
      }),
    });
    couponFindOneMock.mockResolvedValueOnce({
      code: "PROD10",
      isActive: true,
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 1000),
      type: "product_price",
      value: 0,
      usedCount: 0,
      productPriceRules: [
        {
          product: { toString: () => "507f1f77bcf86cd799439011" },
          mode: "percentage",
          value: 10,
        },
      ],
    });
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    const result = await validateAndNormalizeCheckoutInput({
      items: [{ product: "507f1f77bcf86cd799439011", quantity: 2 }],
      billingInfo: {
        type: "personal",
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingAddress: {
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingMethod: "507f1f77bcf86cd799439012",
      paymentMethod: "507f1f77bcf86cd799439013",
      couponCodes: ["PROD10"],
    });

    expect(result.items[0].price).toBe(1143);
    expect(result.subtotal).toBe(2286);
    expect(result.discount).toBe(254);
    expect(result.total).toBe(result.subtotal + result.shippingFee + result.paymentFee);
  });

  it("applies percentage coupon to line item prices for stripe and invoice parity", async () => {
    productFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        name: "Termek",
        isActive: true,
        isVisible: true,
        netPrice: 1000,
        grossPrice: 1270,
        discount: 0,
        vatPercent: 27,
        stock: 10,
        variants: [],
      }),
    });
    couponFindOneMock.mockResolvedValueOnce({
      code: "TEN",
      isActive: true,
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 1000),
      type: "percentage",
      value: 10,
      usedCount: 0,
    });
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    const result = await validateAndNormalizeCheckoutInput({
      items: [{ product: "507f1f77bcf86cd799439011", quantity: 2 }],
      billingInfo: {
        type: "personal",
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingAddress: {
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingMethod: "507f1f77bcf86cd799439012",
      paymentMethod: "507f1f77bcf86cd799439013",
      couponCodes: ["TEN"],
    });

    expect(result.items[0].price).toBeLessThan(1270);
    expect(result.discount).toBeGreaterThan(0);
    expect(result.total).toBe(result.subtotal + result.shippingFee + result.paymentFee);
    expect(result.subtotal).toBe(result.items[0].price * 2);
  });

  it("allows stripe checkout with a coupon applied", async () => {
    couponFindOneMock.mockResolvedValueOnce({
      code: "SAVE",
      isActive: true,
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 1000),
      type: "fixed_amount",
      value: 100,
      usedCount: 0,
    });
    const { validateAndNormalizeCheckoutInput, STRIPE_FIXED_PAYMENT_METHOD_ID } = await import(
      "@wse/core/services/checkout-validation"
    );
    const result = await validateAndNormalizeCheckoutInput(
      {
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: STRIPE_FIXED_PAYMENT_METHOD_ID,
        couponCodes: ["SAVE"],
      },
      { allowStripeFixed: true }
    );

    expect(result.paymentProvider).toBe("stripe");
    expect(result.discount).toBe(100);
    expect(result.total).toBe(result.subtotal + result.shippingFee + result.paymentFee);
  });

  it("handles free shipping coupon", async () => {
    couponFindOneMock.mockResolvedValueOnce({
      code: "FS",
      isActive: true,
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 1000),
      type: "free_shipping",
      value: 0,
      usedCount: 0,
    });
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    const result = await validateAndNormalizeCheckoutInput({
      items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
      billingInfo: {
        type: "personal",
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingAddress: {
        name: "Teszt",
        zip: "1111",
        city: "Bp",
        street: "Fo 1",
        email: "a@a.com",
        phone: "111",
      },
      shippingMethod: "507f1f77bcf86cd799439012",
      paymentMethod: "507f1f77bcf86cd799439013",
      couponCodes: ["FS"],
    });
    expect(result.shippingFee).toBe(0);
  });

  it("rejects invalid coupon", async () => {
    couponFindOneMock.mockResolvedValueOnce(null);
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "507f1f77bcf86cd799439013",
        couponCodes: ["BAD"],
      })
    ).rejects.toThrow("Érvénytelen kuponkód");
  });

  it("rejects checkout when the cart still carries an exhausted limited price", async () => {
    productFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        name: "Limitált termék",
        isActive: true,
        isVisible: true,
        netPrice: 5000,
        grossPrice: 6350,
        discount: 0,
        vatPercent: 27,
        variants: [
          {
            id: "v1",
            netPrice: 5000,
            grossPrice: 6350,
            discount: 0,
            stock: 10,
            isActive: true,
            limitedPrice: {
              enabled: true,
              limitQuantity: 10,
              netPrice: 3000,
              grossPrice: 3810,
              claimedCount: 10,
            },
          },
        ],
      }),
    });

    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [
          {
            product: "507f1f77bcf86cd799439011",
            variantId: "v1",
            quantity: 1,
            price: 3810,
          },
        ],
        billingInfo: {
          type: "personal",
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingAddress: {
          name: "Teszt",
          zip: "1111",
          city: "Bp",
          street: "Fo 1",
          email: "a@a.com",
          phone: "111",
        },
        shippingMethod: "507f1f77bcf86cd799439012",
        paymentMethod: "507f1f77bcf86cd799439013",
      })
    ).rejects.toThrow("limitált ár");
  });
});
