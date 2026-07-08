import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { buildUserOrdersFilter } from "@wse/core/lib/user-orders-query";

describe("buildUserOrdersFilter", () => {
  it("filters by user id only when email is missing", () => {
    const userId = new mongoose.Types.ObjectId().toString();
    expect(buildUserOrdersFilter(userId)).toEqual({
      user: new mongoose.Types.ObjectId(userId),
    });
  });

  it("includes unlinked guest orders with matching billing email", () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const filter = buildUserOrdersFilter(userId, "Buyer@Test.HU");
    expect(filter).toMatchObject({
      $or: [
        { user: new mongoose.Types.ObjectId(userId) },
        expect.objectContaining({
          $expr: expect.any(Object),
        }),
      ],
    });
  });
});
