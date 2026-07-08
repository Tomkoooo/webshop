import JSZip from "jszip"
import { formatOrderNumber } from "@wse/core/lib/order-number"

export type LabelZipOrder = {
  _id: unknown
  glsLabel?: { labelDataBase64?: string } | null
  foxpostShipment?: { labelDataBase64?: string } | null
  standardShippingLabel?: { labelDataBase64?: string } | null
}

export async function buildAdminOrderLabelsZipBuffer(orders: LabelZipOrder[]): Promise<Buffer | null> {
  const zip = new JSZip()
  let fileCount = 0

  for (const order of orders) {
    const orderNumber = formatOrderNumber(order._id)

    if (order.glsLabel?.labelDataBase64) {
      zip.file(`${orderNumber}-gls.pdf`, Buffer.from(order.glsLabel.labelDataBase64, "base64"))
      fileCount += 1
    }

    if (order.foxpostShipment?.labelDataBase64) {
      zip.file(
        `${orderNumber}-foxpost.pdf`,
        Buffer.from(order.foxpostShipment.labelDataBase64, "base64")
      )
      fileCount += 1
    }

    if (order.standardShippingLabel?.labelDataBase64) {
      zip.file(
        `${orderNumber}-shipping.pdf`,
        Buffer.from(order.standardShippingLabel.labelDataBase64, "base64")
      )
      fileCount += 1
    }
  }

  if (fileCount === 0) return null

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
}
