"use client";

import { FoxpostShipmentWorkbench } from "@wse/core/components/admin/foxpost/FoxpostShipmentWorkbench";
import type { FoxpostParcelPoint, FoxpostShipment } from "@wse/core/lib/foxpost";
import type { FoxpostShipmentSource } from "@wse/core/actions/foxpost-shipment";

type FoxpostShipmentPanelProps = {
  source: FoxpostShipmentSource;
  orderId: string;
  parcelManagerEnabled: boolean;
  foxpostParcelPoint?: FoxpostParcelPoint | null;
  foxpostShipment?: FoxpostShipment | null;
  onUpdated?: () => void;
};

export function FoxpostShipmentPanel(props: FoxpostShipmentPanelProps) {
  return <FoxpostShipmentWorkbench {...props} />;
}
