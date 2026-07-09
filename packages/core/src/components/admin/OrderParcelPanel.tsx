"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { Card, CardContent } from "@wse/core/components/ui/card";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import type { ParcelLockerProvider } from "@wse/core/lib/parcel-locker";
import { orderNeedsParcelLabel } from "@wse/core/lib/parcel-locker";
import { adminFieldHint } from "@wse/core/lib/admin-ui";

type GlsParcelPoint = {
  id?: string;
  name?: string;
  contact?: {
    postalCode?: string;
    city?: string;
    address?: string;
  };
};

type FoxpostParcelPoint = {
  id?: string;
  name?: string;
  address?: string;
  zip?: string;
  city?: string;
  findme?: string;
  load?: string;
};

type GlsLabel = {
  parcelNumber?: string;
  generatedAt?: string | Date;
  labelUrl?: string;
  lastError?: string;
};

type FoxpostShipment = {
  clFoxId?: string;
  refCode?: string;
  trackingStatus?: string;
  generatedAt?: string | Date;
  labelUrl?: string;
  lastError?: string;
};

type ParcelActionResult = {
  success: boolean;
  error?: string;
};

type OrderParcelPanelProps = {
  parcelManagerEnabled: boolean;
  provider: ParcelLockerProvider;
  orderId: string;
  glsParcelPoint?: GlsParcelPoint | null;
  foxpostParcelPoint?: FoxpostParcelPoint | null;
  glsLabel?: GlsLabel | null;
  foxpostShipment?: FoxpostShipment | null;
  generateGlsAction: () => Promise<ParcelActionResult>;
  generateFoxpostAction: () => Promise<ParcelActionResult>;
  onUpdated?: () => void;
};

type GenerateLabelButtonProps = {
  label: string;
  pendingLabel: string;
  onGenerate: () => Promise<ParcelActionResult>;
  onResult: (result: ParcelActionResult | null) => void;
  onUpdated?: () => void;
};

function GenerateLabelButton({
  label,
  pendingLabel,
  onGenerate,
  onResult,
  onUpdated,
}: GenerateLabelButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        onResult(null);
        startTransition(async () => {
          const result = await onGenerate();
          onResult(result);
          router.refresh();
          if (result.success) onUpdated?.();
        });
      }}
      className="h-10"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      {isPending ? pendingLabel : label}
    </Button>
  );
}

export function OrderParcelPanel({
  parcelManagerEnabled,
  provider,
  orderId,
  glsParcelPoint,
  foxpostParcelPoint,
  glsLabel,
  foxpostShipment,
  generateGlsAction,
  generateFoxpostAction,
  onUpdated,
}: OrderParcelPanelProps) {
  void orderId;
  const [lastResult, setLastResult] = useState<ParcelActionResult | null>(null);
  const orderSnapshot = {
    glsParcelPoint,
    foxpostParcelPoint,
    glsLabel,
    foxpostShipment,
  };
  const needsLabel = orderNeedsParcelLabel(orderSnapshot);
  const glsError = lastResult?.success ? undefined : lastResult?.error || glsLabel?.lastError;
  const foxpostError = lastResult?.success ? undefined : lastResult?.error || foxpostShipment?.lastError;
  const successMessage = lastResult?.success ? "Frissítés sikeres. Az adatok újratöltése folyamatban / kész." : null;

  if (provider === "gls") {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium text-foreground">GLS</p>
          <p className="text-sm text-foreground">
            <span>{glsParcelPoint?.name}</span>
            {glsParcelPoint?.id ? (
              <span className="mt-1 block text-muted-foreground">ID: {glsParcelPoint.id}</span>
            ) : null}
          </p>
          {glsParcelPoint?.contact ? (
            <p className={adminFieldHint}>
              {glsParcelPoint.contact.postalCode} {glsParcelPoint.contact.city}{" "}
              {glsParcelPoint.contact.address}
            </p>
          ) : null}
          {parcelManagerEnabled && glsParcelPoint?.id ? (
            <GenerateLabelButton
              label="GLS címke generálása"
              pendingLabel="GLS címke készül..."
              onGenerate={generateGlsAction}
              onResult={setLastResult}
              onUpdated={onUpdated}
            />
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-800">{successMessage}</p>
          ) : null}
          {glsLabel?.parcelNumber ? (
            <div className="space-y-1 text-sm text-foreground">
              <p>
                Csomagszám: <span className="font-medium">{glsLabel.parcelNumber}</span>
              </p>
              {glsLabel.generatedAt ? (
                <p>
                  Generálva:{" "}
                  <span className="font-medium">
                    {format(new Date(glsLabel.generatedAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
                  </span>
                </p>
              ) : null}
              {glsLabel.labelUrl ? (
                <a
                  href={glsLabel.labelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-primary hover:underline"
                >
                  Címke megnyitása
                </a>
              ) : null}
            </div>
          ) : needsLabel ? (
            <p className="text-sm text-amber-800">Címke hiányzik</p>
          ) : null}
          {glsError ? (
            <p className="text-sm text-rose-600">GLS hiba: {glsError}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium text-foreground">Foxpost</p>
        <p className="text-sm text-foreground">
          <span>{foxpostParcelPoint?.name}</span>
          {foxpostParcelPoint?.id ? (
            <span className="mt-1 block text-muted-foreground">Automata: {foxpostParcelPoint.id}</span>
          ) : null}
        </p>
        <p className={adminFieldHint}>
          {foxpostParcelPoint?.zip} {foxpostParcelPoint?.city} {foxpostParcelPoint?.address}
        </p>
        {foxpostParcelPoint?.findme ? (
          <p className="text-xs text-muted-foreground">{foxpostParcelPoint.findme}</p>
        ) : null}
        {foxpostParcelPoint?.load ? (
          <p className="text-xs text-muted-foreground">Telítettség: {foxpostParcelPoint.load}</p>
        ) : null}
        {parcelManagerEnabled && foxpostParcelPoint?.id ? (
          <GenerateLabelButton
            label="Foxpost csomag + címke"
            pendingLabel="Foxpost címke készül..."
            onGenerate={generateFoxpostAction}
            onResult={setLastResult}
            onUpdated={onUpdated}
          />
        ) : null}
        {successMessage ? (
          <p className="text-sm text-emerald-800">{successMessage}</p>
        ) : null}
        {foxpostShipment?.clFoxId ? (
          <div className="space-y-1 text-sm text-foreground">
            <p>
              CLFOX: <span className="font-medium">{foxpostShipment.clFoxId}</span>
            </p>
            {foxpostShipment.refCode ? (
              <p>
                Ref: <span className="font-medium">{foxpostShipment.refCode}</span>
              </p>
            ) : null}
            {foxpostShipment.trackingStatus ? (
              <p>
                Státusz: <span className="font-medium">{foxpostShipment.trackingStatus}</span>
              </p>
            ) : null}
            {foxpostShipment.generatedAt ? (
              <p>
                Generálva:{" "}
                <span className="font-medium">
                  {format(new Date(foxpostShipment.generatedAt), "yyyy. MMMM dd. HH:mm", {
                    locale: hu,
                  })}
                </span>
              </p>
            ) : null}
            {foxpostShipment.labelUrl ? (
              <a
                href={foxpostShipment.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-primary hover:underline"
              >
                Címke megnyitása
              </a>
            ) : null}
          </div>
        ) : needsLabel ? (
          <p className="text-sm text-amber-800">Csomag/címke hiányzik</p>
        ) : null}
        {foxpostError ? (
          <p className="text-sm text-rose-600">Foxpost hiba: {foxpostError}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
