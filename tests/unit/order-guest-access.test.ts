import { beforeEach, describe, expect, it, vi } from "vitest";

const dbConnectMock = vi.fn();
const orderUpdateManyMock = vi.fn();
const orderFindByIdMock = vi.fn();
const orderFindByIdAndUpdateMock = vi.fn();
const tokenDeleteManyMock = vi.fn();
const tokenCreateMock = vi.fn();
const tokenFindOneMock = vi.fn();
const tokenFindOneAndUpdateMock = vi.fn();
const tokenUpdateManyMock = vi.fn();

vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/Order", () => ({
  default: {
    updateMany: orderUpdateManyMock,
    findById: orderFindByIdMock,
    findByIdAndUpdate: orderFindByIdAndUpdateMock,
  },
}));
vi.mock("@wse/core/models/OrderGuestAccessToken", () => ({
  default: {
    deleteMany: tokenDeleteManyMock,
    create: tokenCreateMock,
    findOne: tokenFindOneMock,
    findOneAndUpdate: tokenFindOneAndUpdateMock,
    updateMany: tokenUpdateManyMock,
  },
}));

describe("order guest access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbConnectMock.mockResolvedValue(undefined);
    tokenDeleteManyMock.mockResolvedValue({});
    tokenCreateMock.mockResolvedValue({});
    tokenFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "t1" }) });
    orderUpdateManyMock.mockResolvedValue({ modifiedCount: 2 });
    orderFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "o1",
        billingInfo: { email: "Guest@Test.HU" },
      }),
    });
    orderFindByIdAndUpdateMock.mockResolvedValue({});
    tokenFindOneAndUpdateMock.mockResolvedValue({});
    tokenUpdateManyMock.mockResolvedValue({});
  });

  it("normalizes email for linking", async () => {
    const { normalizeOrderEmail } = await import("@wse/core/lib/order-guest-access");
    expect(normalizeOrderEmail("  Guest@Test.HU ")).toBe("guest@test.hu");
  });

  it("creates guest token and stores hash", async () => {
    const { OrderGuestAccessService } = await import("@wse/core/services/order-guest-access");
    const raw = await OrderGuestAccessService.createForOrder("507f1f77bcf86cd799439011", "guest@test.hu");
    expect(raw).toHaveLength(64);
    expect(tokenDeleteManyMock).toHaveBeenCalled();
    expect(tokenCreateMock).toHaveBeenCalled();
  });

  it("links guest orders on sign-in email match", async () => {
    const { OrderGuestAccessService } = await import("@wse/core/services/order-guest-access");
    const count = await OrderGuestAccessService.linkGuestOrdersToUser(
      "507f1f77bcf86cd799439012",
      "guest@test.hu"
    );
    expect(count).toBe(2);
    expect(orderUpdateManyMock).toHaveBeenCalled();
    expect(tokenUpdateManyMock).toHaveBeenCalled();
  });

  it("claims order when token and email match", async () => {
    const { OrderGuestAccessService } = await import("@wse/core/services/order-guest-access");
    const raw = await OrderGuestAccessService.createForOrder("507f1f77bcf86cd799439011", "guest@test.hu");
    const result = await OrderGuestAccessService.claimOrderForUser(
      "507f1f77bcf86cd799439011",
      raw,
      "507f1f77bcf86cd799439012",
      "guest@test.hu"
    );
    expect(result.ok).toBe(true);
    expect(orderFindByIdAndUpdateMock).toHaveBeenCalled();
  });
});
