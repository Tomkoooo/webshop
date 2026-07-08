export function orderDetailApiPayload(order: Record<string, unknown>, orderId: string) {
  return {
    ...order,
    invoiceDownloadUrl: `/api/user/orders/${orderId}/invoice`,
    guestInvoiceDownloadUrl: `/api/orders/guest/${orderId}/invoice`,
  };
}
