import { format } from "date-fns"
import type { ICampRegistration } from "../models/CampRegistration"

export function buildCampRegistrationExportRows(registrations: ICampRegistration[]) {
  const rows: Record<string, string>[] = []

  for (const reg of registrations) {
    const paidAt = reg.paidAt
      ? format(reg.paidAt instanceof Date ? reg.paidAt : new Date(reg.paidAt), "yyyy-MM-dd HH:mm")
      : ""
    const totalPerChild =
      reg.childCount > 0 ? Math.round(reg.totalHuf / reg.childCount).toString() : ""

    for (const child of reg.children) {
      rows.push({
        "Vásárló neve": reg.buyerName,
        Email: reg.buyerEmail,
        Telefon: reg.buyerPhone,
        "Gyerek neve": child.name,
        "Születési dátum": child.birthDate,
        Étkezés: child.diningOption || "Normál",
        "Étkezéssel kapcsolatos kérés": child.dietaryRequest || "",
        Allergia: child.allergies || "",
        "Laptop bérlés": child.laptopRental ? "Igen" : "Nem",
        "Családi kedvezmény (Ft)": reg.priceBreakdown?.familyDiscountHuf
          ? String(reg.priceBreakdown.familyDiscountHuf)
          : "",
        "Early bird (Ft)": reg.priceBreakdown?.earlyBirdSavingsHuf
          ? String(reg.priceBreakdown.earlyBirdSavingsHuf)
          : "",
        Turnus: reg.sessionLabel,
        Jegytípus: reg.ticketTypeName,
        "Foglalás dátuma": paidAt,
        "Fizetett összeg (Ft)": String(reg.totalHuf),
        "Összeg / gyerek (Ft)": totalPerChild,
      })
    }
  }

  return rows
}

export async function buildCampRegistrationExcelBuffer(
  registrations: ICampRegistration[],
  meta: { sessionLabel: string; campTitle: string }
) {
  const XLSX = await import("xlsx")
  const rows = buildCampRegistrationExportRows(registrations)
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Regisztrációk")

  const metaSheet = XLSX.utils.aoa_to_sheet([
    ["Exportálva", format(new Date(), "yyyy-MM-dd HH:mm:ss")],
    ["Tábor", meta.campTitle],
    ["Turnus", meta.sessionLabel],
    ["Sorok száma", rows.length],
  ])
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Meta")

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer
}
