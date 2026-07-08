import { describe, expect, it } from "vitest";
import {
  buildAdminCustomerRows,
  summarizeAdminCustomers,
} from "@wse/core/lib/admin-customers";

const registeredUsers = [
  { _id: "u1", name: "Registered Buyer", email: "Buyer@Example.com", role: "USER" as const },
  { _id: "u2", name: "No Orders", email: "no-orders@example.com", role: "USER" as const },
  { _id: "admin1", name: "Admin", email: "admin@example.com", role: "ADMIN" as const },
];

const orders = [
  {
    _id: "o1",
    user: "u1",
    total: 1000,
    status: "delivered",
    createdAt: "2026-01-01T10:00:00.000Z",
    billingInfo: { name: "Registered Buyer", email: "buyer@example.com" },
  },
  {
    _id: "o2",
    total: 2000,
    status: "processing",
    createdAt: "2026-01-02T10:00:00.000Z",
    billingInfo: { name: "Guest Buyer", email: "guest@example.com" },
  },
  {
    _id: "o3",
    total: 3000,
    status: "cancelled",
    createdAt: "2026-01-03T10:00:00.000Z",
    billingInfo: { name: "Cancelled Guest", email: "cancelled@example.com" },
  },
  {
    _id: "o4",
    total: 500,
    status: "pending",
    createdAt: "2026-01-04T10:00:00.000Z",
    billingInfo: { name: "Unlinked Registered", email: "BUYER@example.com" },
  },
];

describe("admin customer aggregation", () => {
  it("counts all order customers while separating registered accounts and guest buyers", () => {
    expect(summarizeAdminCustomers(orders, registeredUsers)).toEqual({
      totalCustomersCount: 2,
      registeredCustomersCount: 2,
      registeredOrderCustomersCount: 1,
      guestCustomersCount: 1,
    });
  });

  it("builds registered and guest rows with same-email dedupe", () => {
    const rows = buildAdminCustomerRows(registeredUsers, orders);
    const registered = rows.find((row) => row._id === "u1");
    const guest = rows.find((row) => row._id === "guest:guest@example.com");

    expect(registered?.kind).toBe("registered");
    expect(registered?.ordersCount).toBe(2);
    expect(registered?.totalSpent).toBe(1500);
    expect(guest?.kind).toBe("guest");
    expect(guest?.ordersCount).toBe(1);
    expect(rows.some((row) => row.email === "cancelled@example.com")).toBe(false);
  });

  it("filters by customer kind and order presence", () => {
    expect(buildAdminCustomerRows(registeredUsers, orders, { kind: "guest" })).toHaveLength(1);
    expect(buildAdminCustomerRows(registeredUsers, orders, { kind: "registered", hasOrders: "no" }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ _id: "u2", ordersCount: 0 }),
        expect.objectContaining({ _id: "admin1", ordersCount: 0 }),
      ]));
  });
});
