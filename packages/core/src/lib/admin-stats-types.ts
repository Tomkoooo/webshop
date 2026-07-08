export const ADMIN_RECENT_ORDERS_PAGE_SIZE = 5;

export type AdminStatsOptions = {
  recentPage?: number;
};

export type DailyIncomeRow = {
  date: string;
  revenue: number;
  orders: number;
};

export type DailyProductRow = {
  date: string;
  productId: string;
  productName: string;
  soldQuantity: number;
  revenue: number;
};
