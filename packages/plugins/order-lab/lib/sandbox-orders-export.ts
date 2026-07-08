import { format } from "date-fns";
import { buildAdminLabelAbsoluteUrl } from "@wse/core/lib/admin-orders-export";
import { extractIssueNumberFromLine } from "@wse/core/lib/unique-numbered-variants";

const FOXPOST_LABEL_LINK_COLUMN = "Foxpost címke link";
const FOXPOST_LABEL_GENERATED_COLUMN = "Foxpost címke generálva";

const STATUS_LABELS: Record<string, string> = {
  pending: "Függőben",
  processing: "Feldolgozás alatt",
  shipped: "Szállítva",
  delivered: "Kézbesítve",
  cancelled: "Törölve",
};

export type SandboxExportOrder = {
  _id: unknown;
  orderNumber: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  status?: string;
  notes?: string;
  shippingAddress?: {
    name?: string;
    email?: string;
    phone?: string;
    zip?: string;
    city?: string;
    street?: string;
    comment?: string;
  };
  foxpostParcelPoint?: {
    id?: string;
    name?: string;
    address?: string;
    zip?: string;
    city?: string;
  };
  foxpostShipment?: {
    clFoxId?: string;
    refCode?: string;
    trackingStatus?: string;
    labelUrl?: string;
    generatedAt?: Date | string;
  };
  items?: Array<{
    productId?: unknown;
    variantId?: string;
    variantLabel?: string;
    selectedAttributes?: Record<string, string>;
    name?: string;
    price?: number;
    quantity?: number;
    vatPercent?: number;
  }>;
  subtotal?: number;
  shippingFee?: number;
  total?: number;
};

function formatDateTime(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

function stringifyAttributes(attrs: Record<string, string> | undefined): string {
  if (!attrs || typeof attrs !== "object") return "";
  return Object.entries(attrs)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

const MAX_ITEM_COLS = 8;

function addItemsAsColumns(
  row: Record<string, string | number>,
  items: SandboxExportOrder["items"] | undefined
): Record<string, string | number> {
  const safeItems = Array.isArray(items) ? items : [];
  row["Tételek száma"] = safeItems.length;
  row["Tételek (összegzés)"] = safeItems
    .map((item) => {
      const name = String(item?.name || "").trim();
      const qty = Number(item?.quantity || 0);
      const unit = Number(item?.price || 0);
      const variant = String(item?.variantLabel || "").trim();
      return `${name}${variant ? ` (${variant})` : ""} × ${qty} @ ${unit}`;
    })
    .filter(Boolean)
    .join(" || ");

  for (let i = 0; i < MAX_ITEM_COLS; i += 1) {
    const item = safeItems[i];
    const n = i + 1;
    row[`Tétel ${n} név`] = item?.name || "";
    row[`Tétel ${n} variáns ID`] = item?.variantId || "";
    row[`Tétel ${n} sorszám`] = extractIssueNumberFromLine(
      item?.selectedAttributes,
      item?.variantLabel
    );
    row[`Tétel ${n} variáns`] = item?.variantLabel || "";
    row[`Tétel ${n} mennyiség`] = item?.quantity != null ? Number(item.quantity || 0) : "";
    row[`Tétel ${n} egységár (bruttó)`] = item?.price != null ? Number(item.price || 0) : "";
    if (item?.quantity != null && item?.price != null) {
      row[`Tétel ${n} sorösszeg`] = Number(item.quantity) * Number(item.price);
    } else {
      row[`Tétel ${n} sorösszeg`] = "";
    }
  }

  return row;
}

export function buildSandboxOrdersExportRows(orders: SandboxExportOrder[]) {
  const rows: Record<string, string | number>[] = [];

  for (const order of orders) {
    const shipping = order.shippingAddress || {};
    const foxpost = order.foxpostParcelPoint || {};
    const base = {
      "Sandbox rendelés szám": order.orderNumber,
      "MongoDB azonosító": String(order._id || ""),
      Létrehozva: formatDateTime(order.createdAt),
      Frissítve: formatDateTime(order.updatedAt),
      Státusz: STATUS_LABELS[String(order.status || "")] || String(order.status || ""),
      Megjegyzés: order.notes || "",
      "Címzett név": String(shipping.name || ""),
      "Címzett email": String(shipping.email || ""),
      "Címzett telefon": String(shipping.phone || ""),
      "Szállítási irányítószám": String(shipping.zip || ""),
      "Szállítási város": String(shipping.city || ""),
      "Szállítási cím": String(shipping.street || ""),
      "Szállítási megjegyzés": String(shipping.comment || ""),
      "Foxpost automata ID": String(foxpost.id || ""),
      "Foxpost automata név": String(foxpost.name || ""),
      "Foxpost cím": String(foxpost.address || ""),
      "Foxpost azonosító": order.foxpostShipment?.clFoxId || "",
      "Foxpost ref": order.foxpostShipment?.refCode || "",
      "Foxpost státusz": order.foxpostShipment?.trackingStatus || "",
      [FOXPOST_LABEL_LINK_COLUMN]: order.foxpostShipment?.labelUrl
        ? buildAdminLabelAbsoluteUrl(order.foxpostShipment.labelUrl)
        : "",
      [FOXPOST_LABEL_GENERATED_COLUMN]: formatDateTime(order.foxpostShipment?.generatedAt),
      Részösszeg: order.subtotal ?? "",
      "Szállítási díj": order.shippingFee ?? "",
      Összesen: order.total ?? "",
    };
    rows.push(addItemsAsColumns({ ...base }, order.items));
  }

  return rows;
}

export async function buildSandboxOrdersExcelBuffer(orders: SandboxExportOrder[]) {
  const XLSX = await import("xlsx");
  const rows = buildSandboxOrdersExportRows(orders);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    const linkIndex = headers.indexOf(FOXPOST_LABEL_LINK_COLUMN);
    if (linkIndex >= 0) {
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const url = String(rows[rowIndex][FOXPOST_LABEL_LINK_COLUMN] || "").trim();
        if (!url.startsWith("http")) continue;
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: linkIndex });
        const cell = worksheet[cellAddress] as { l?: { Target: string; Tooltip: string } } | undefined;
        if (cell) cell.l = { Target: url, Tooltip: "Címke megnyitása" };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sandbox rendelések");

  const metaRows = [
    ["Exportálva", format(new Date(), "yyyy-MM-dd HH:mm:ss")],
    ["Forrás", "order-lab / sandbox_orders"],
    ["Sorok száma", rows.length],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(metaRows), "Meta");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
