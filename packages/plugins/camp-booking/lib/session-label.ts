import { format } from "date-fns"
import { hu } from "date-fns/locale"

export function formatSessionLabel(label: string, startDate: Date, endDate: Date): string {
  const start = format(startDate, "yyyy. MMM d.", { locale: hu })
  const end = format(endDate, "yyyy. MMM d.", { locale: hu })
  if (label.trim()) return `${label.trim()} (${start} – ${end})`
  return `${start} – ${end}`
}
