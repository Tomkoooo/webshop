export type OrderStatusHistoryEntry = {
  from: string
  to: string
  changedAt: Date
}

export function recordOrderStatusChange(
  order: {
    status: string
    statusChangedAt?: Date
    statusHistory?: OrderStatusHistoryEntry[]
  },
  oldStatus: string,
  newStatus: string,
  changedAt: Date = new Date()
): boolean {
  if (oldStatus === newStatus) return false

  order.status = newStatus
  order.statusChangedAt = changedAt
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : []
  history.push({ from: oldStatus, to: newStatus, changedAt })
  order.statusHistory = history
  return true
}
