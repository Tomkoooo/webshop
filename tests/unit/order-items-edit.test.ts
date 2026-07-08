import { beforeEach, describe, expect, it, vi } from "vitest";

const dbConnectMock = vi.fn();
const orderFindByIdMock = vi.fn();
const productFindMock = vi.fn();
const productFindByIdMock = vi.fn();
const decrementCheckoutLineStockMock = vi.fn();
const restoreCheckoutLineStockMock = vi.fn();

vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/Order", () => ({ default: { findById: orderFindByIdMock } }));
vi.mock("@wse/core/models/Product", () => ({
  default: {
    find: productFindMock,
    findById: productFindByIdMock,
  },
}));
vi.mock("@wse/core/services/inventory-reservation", () => ({
  InventoryReservationError: class InventoryReservationError extends Error {
    code = "INSUFFICIENT_STOCK";
  },
  decrementCheckoutLineStock: (...args: unknown[]) => decrementCheckoutLineStockMock(...args),
  restoreCheckoutLineStock: (...args: unknown[]) => restoreCheckoutLineStockMock(...args),
}));

describe("order-items-edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbConnectMock.mockResolvedValue(undefined);
    restoreCheckoutLineStockMock.mockResolvedValue(undefined);
    decrementCheckoutLineStockMock.mockResolvedValue({
      product: "prod1",
      quantity: 2,
      promoQuantity: 0,
      regularQuantity: 2,
      regularUnitPrice: 5000,
      vatPercent: 27,
    });
  });

  it("allows editing pending and processing orders only", async () => {
    const { canEditOrderItems } = await import("@wse/core/lib/order-items-edit");
    expect(canEditOrderItems({ status: "pending" })).toBe(true);
    expect(canEditOrderItems({ status: "processing" })).toBe(true);
    expect(canEditOrderItems({ status: "shipped" })).toBe(false);
    expect(canEditOrderItems({ status: "deleted" })).toBe(false);
  });

  it("removes an item, restores stock, and recalculates totals", async () => {
    const order = {
      status: "pending",
      items: [
        { product: "507f1f77bcf86cd799439011", name: "A", price: 1000, quantity: 1 },
        { product: "507f1f77bcf86cd799439012", name: "B", price: 2000, quantity: 2 },
      ],
      shippingFee: 500,
      paymentFee: 0,
      discount: 0,
      subtotal: 5000,
      total: 5500,
      save: vi.fn(),
    };
    orderFindByIdMock.mockResolvedValue(order);

    const { removeOrderItem } = await import("@wse/core/services/order-items-edit");
    const result = await removeOrderItem("ord1", 1);

    expect(result.success).toBe(true);
    expect(restoreCheckoutLineStockMock).toHaveBeenCalledWith({
      product: "507f1f77bcf86cd799439012",
      variantId: undefined,
      quantity: 2,
      promoQuantity: 0,
      promoCounter: "sold",
    });
    expect(order.items).toHaveLength(1);
    expect(order.subtotal).toBe(1000);
    expect(order.total).toBe(1500);
    expect(order.save).toHaveBeenCalled();
  });

  it("blocks removing the last item", async () => {
    orderFindByIdMock.mockResolvedValue({
      status: "pending",
      items: [{ product: "507f1f77bcf86cd799439011", name: "A", price: 1000, quantity: 1 }],
      save: vi.fn(),
    });

    const { removeOrderItem } = await import("@wse/core/services/order-items-edit");
    await expect(removeOrderItem("ord1", 0)).rejects.toThrow("legalább egy tétel");
  });

  it("adds an item with current pricing and stock decrement", async () => {
    const order = {
      status: "processing",
      items: [{ product: "507f1f77bcf86cd799439011", name: "A", price: 1000, quantity: 1 }],
      shippingFee: 0,
      paymentFee: 0,
      discount: 0,
      subtotal: 1000,
      total: 1000,
      save: vi.fn(),
    };
    orderFindByIdMock.mockResolvedValue(order);
    productFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
        name: "New product",
        isActive: true,
        isVisible: true,
        deletedAt: null,
        netPrice: 4000,
        discount: 0,
        stock: 10,
        vatPercent: 27,
        variants: [],
        requireVariantSelection: false,
      }),
    });

    const { addOrderItem } = await import("@wse/core/services/order-items-edit");
    const result = await addOrderItem("ord1", {
      productId: "507f1f77bcf86cd799439012",
      quantity: 2,
    });

    expect(result.success).toBe(true);
    expect(decrementCheckoutLineStockMock).toHaveBeenCalledWith(undefined, {
      product: "507f1f77bcf86cd799439012",
      variantId: undefined,
      quantity: 2,
      promoCounter: "sold",
    });
    expect(order.items).toHaveLength(2);
    expect(order.subtotal).toBe(11000);
    expect(order.total).toBe(11000);
    expect(order.save).toHaveBeenCalled();
  });
});
