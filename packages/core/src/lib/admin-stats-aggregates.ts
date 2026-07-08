type MonthlyRevenueBucket = {
  label: string;
  revenue: number;
  orders: number;
};

export type MonthlyRevenueAggRow = {
  _id: { year: number; month: number };
  revenue: number;
  orders: number;
};

function startOfMonth(date: Date): Date {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Build the last six calendar months (incl. current) for the stats chart. */
export function buildMonthlyRevenueSeries(
  buckets: MonthlyRevenueAggRow[],
  now: Date = new Date()
): MonthlyRevenueBucket[] {
  const byKey = new Map<string, { revenue: number; orders: number }>();
  for (const row of buckets) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    byKey.set(key, { revenue: row.revenue || 0, orders: row.orders || 0 });
  }

  return Array.from({ length: 6 })
    .map((_, index) => {
      const date = new Date(now);
      date.setMonth(date.getMonth() - index);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const bucket = byKey.get(key);
      return {
        label: `${year}.${String(month).padStart(2, "0")}`,
        revenue: bucket?.revenue ?? 0,
        orders: bucket?.orders ?? 0,
      };
    })
    .reverse();
}

export function sixMonthsAgoStart(now: Date = new Date()): Date {
  const start = startOfMonth(now);
  start.setMonth(start.getMonth() - 5);
  return start;
}
