import { normalizeOrderEmail } from "@wse/core/lib/order-guest-access";

type IdLike = { toString(): string };

export type AdminCustomerKind = "registered" | "guest";

export type AdminCustomerUserSource = {
  _id: IdLike | string;
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  createdAt?: string | Date;
};

export type AdminCustomerOrderSource = {
  _id: IdLike | string;
  total?: number;
  status?: string;
  createdAt?: string | Date;
  user?: IdLike | string | null;
  billingInfo?: {
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    name?: string;
    email?: string;
  };
};

export type AdminCustomerRecentOrder = {
  _id: string;
  total: number;
  status: string;
  createdAt: string | Date;
};

export type AdminCustomerRow = {
  _id: string;
  kind: AdminCustomerKind;
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | Date | null;
  recentOrders: AdminCustomerRecentOrder[];
  createdAt?: string | Date;
};

export type AdminCustomerFilters = {
  q?: string;
  role?: string;
  hasOrders?: string;
  kind?: string;
};

export type AdminCustomerMetricSummary = {
  totalCustomersCount: number;
  registeredCustomersCount: number;
  registeredOrderCustomersCount: number;
  guestCustomersCount: number;
};

export function normalizeCustomerEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed ? normalizeOrderEmail(trimmed) : "";
}

function idToString(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toString" in value) return String(value.toString());
  return "";
}

function orderEmail(order: AdminCustomerOrderSource): string {
  return (
    normalizeCustomerEmail(order.billingInfo?.email) ||
    normalizeCustomerEmail(order.shippingAddress?.email)
  );
}

function orderName(order: AdminCustomerOrderSource): string | undefined {
  return order.billingInfo?.name || order.shippingAddress?.name || undefined;
}

function orderDateMs(order: Pick<AdminCustomerOrderSource, "createdAt">): number {
  const value = order.createdAt ? new Date(order.createdAt).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function isNonCancelledOrder(order: AdminCustomerOrderSource): boolean {
  return order.status !== "cancelled";
}

export function summarizeAdminCustomers(
  orders: AdminCustomerOrderSource[],
  users: AdminCustomerUserSource[]
): AdminCustomerMetricSummary {
  const orderEmails = orders
    .filter(isNonCancelledOrder)
    .map(orderEmail)
    .filter(Boolean);
  return summarizeAdminCustomersFromOrderEmails(orderEmails, users);
}

export function summarizeAdminCustomersFromOrderEmails(
  orderEmails: string[],
  users: AdminCustomerUserSource[]
): AdminCustomerMetricSummary {
  const registeredUsers = users.filter((user) => user.role !== "ADMIN");
  const registeredEmails = new Set(
    registeredUsers
      .map((user) => normalizeCustomerEmail(user.email))
      .filter(Boolean)
  );
  const orderCustomerEmails = new Set(
    orderEmails.map((email) => normalizeCustomerEmail(email)).filter(Boolean)
  );
  const registeredOrderEmails = [...orderCustomerEmails].filter((email) =>
    registeredEmails.has(email)
  );

  return {
    totalCustomersCount: orderCustomerEmails.size,
    registeredCustomersCount: registeredUsers.length,
    registeredOrderCustomersCount: registeredOrderEmails.length,
    guestCustomersCount: Math.max(0, orderCustomerEmails.size - registeredOrderEmails.length),
  };
}

export function buildAdminCustomerRows(
  users: AdminCustomerUserSource[],
  orders: AdminCustomerOrderSource[],
  filters: AdminCustomerFilters = {}
): AdminCustomerRow[] {
  const nonCancelledOrders = orders.filter(isNonCancelledOrder);
  const registeredUsers = users;
  const registeredEmails = new Set(
    registeredUsers
      .map((user) => normalizeCustomerEmail(user.email))
      .filter(Boolean)
  );

  const ordersByUserId = new Map<string, AdminCustomerOrderSource[]>();
  const ordersByEmail = new Map<string, AdminCustomerOrderSource[]>();

  for (const order of nonCancelledOrders) {
    const userId = idToString(order.user);
    if (userId) {
      const list = ordersByUserId.get(userId) || [];
      list.push(order);
      ordersByUserId.set(userId, list);
    }

    const email = orderEmail(order);
    if (email) {
      const list = ordersByEmail.get(email) || [];
      list.push(order);
      ordersByEmail.set(email, list);
    }
  }

  const rows: AdminCustomerRow[] = registeredUsers.map((user) => {
    const userId = idToString(user._id);
    const email = normalizeCustomerEmail(user.email);
    const userOrders = [
      ...(ordersByUserId.get(userId) || []),
      ...(email ? ordersByEmail.get(email) || [] : []),
    ];
    const uniqueOrders = dedupeOrders(userOrders);
    return buildCustomerRow({
      id: userId,
      kind: "registered",
      name: user.name,
      email: user.email,
      role: user.role || "USER",
      orders: uniqueOrders,
      createdAt: user.createdAt,
    });
  });

  for (const [email, groupedOrders] of ordersByEmail) {
    if (registeredEmails.has(email)) continue;
    const latestOrder = [...groupedOrders].sort((a, b) => orderDateMs(b) - orderDateMs(a))[0];
    rows.push(
      buildCustomerRow({
        id: `guest:${email}`,
        kind: "guest",
        name: orderName(latestOrder),
        email,
        orders: groupedOrders,
      })
    );
  }

  return rows
    .filter((row) => matchesCustomerFilters(row, filters))
    .sort((a, b) => {
      const aTime = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
      const bTime = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return (a.email || a.name || "").localeCompare(b.email || b.name || "");
    });
}

function buildCustomerRow(input: {
  id: string;
  kind: AdminCustomerKind;
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  orders: AdminCustomerOrderSource[];
  createdAt?: string | Date;
}): AdminCustomerRow {
  const sortedOrders = [...input.orders].sort((a, b) => orderDateMs(b) - orderDateMs(a));
  const recentOrders = sortedOrders.slice(0, 5).map((order) => ({
    _id: idToString(order._id),
    total: Number(order.total || 0),
    status: String(order.status || ""),
    createdAt: order.createdAt || "",
  }));

  return {
    _id: input.id,
    kind: input.kind,
    name: input.name,
    email: input.email,
    role: input.role,
    ordersCount: sortedOrders.length,
    totalSpent: sortedOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    lastOrderAt: sortedOrders[0]?.createdAt || null,
    recentOrders,
    createdAt: input.createdAt,
  };
}

function dedupeOrders(orders: AdminCustomerOrderSource[]): AdminCustomerOrderSource[] {
  const seen = new Set<string>();
  const result: AdminCustomerOrderSource[] = [];
  for (const order of orders) {
    const id = idToString(order._id);
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    result.push(order);
  }
  return result;
}

function matchesCustomerFilters(row: AdminCustomerRow, filters: AdminCustomerFilters): boolean {
  if (filters.kind === "registered" && row.kind !== "registered") return false;
  if (filters.kind === "guest" && row.kind !== "guest") return false;
  if (filters.role && filters.role !== "all") {
    if (row.kind !== "registered" || row.role !== filters.role) return false;
  }
  if (filters.hasOrders === "yes" && row.ordersCount <= 0) return false;
  if (filters.hasOrders === "no" && row.ordersCount > 0) return false;

  const search = String(filters.q || "").trim().toLowerCase();
  if (!search) return true;

  return [row.name, row.email, row.kind]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(search);
}
