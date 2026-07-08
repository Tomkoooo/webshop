import JSZip from "jszip";

export type SandboxLabelZipOrder = {
  orderNumber: string;
  foxpostShipment?: { labelDataBase64?: string } | null;
};

export async function buildSandboxOrderLabelsZipBuffer(
  orders: SandboxLabelZipOrder[]
): Promise<Buffer | null> {
  const zip = new JSZip();
  let fileCount = 0;

  for (const order of orders) {
    if (!order.foxpostShipment?.labelDataBase64) continue;
    zip.file(
      `${order.orderNumber}-foxpost.pdf`,
      Buffer.from(order.foxpostShipment.labelDataBase64, "base64")
    );
    fileCount += 1;
  }

  if (fileCount === 0) return null;

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
