"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import type { ParcelLockerProvider } from "@wse/core/lib/parcel-locker";
import { orderNeedsParcelLabel } from "@wse/core/lib/parcel-locker";

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
      className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Printer className="w-4 h-4 mr-2" />
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
      <div className="rounded border border-white/10 bg-black/40 p-4 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest admin-text-accent">GLS</p>
        <p className="text-[11px] text-neutral-300">
          <span className="text-white">{glsParcelPoint?.name}</span>
          {glsParcelPoint?.id ? (
            <span className="block text-neutral-500 mt-1">ID: {glsParcelPoint.id}</span>
          ) : null}
        </p>
        {glsParcelPoint?.contact ? (
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
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
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            {successMessage}
          </p>
        ) : null}
        {glsLabel?.parcelNumber ? (
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-300 space-y-1">
            <p>
              Csomagszám: <span className="text-white">{glsLabel.parcelNumber}</span>
            </p>
            {glsLabel.generatedAt ? (
              <p>
                Generálva:{" "}
                <span className="text-white">
                  {format(new Date(glsLabel.generatedAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
                </span>
              </p>
            ) : null}
            {glsLabel.labelUrl ? (
              <a
                href={glsLabel.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex admin-link-accent"
              >
                Címke megnyitása
              </a>
            ) : null}
          </div>
        ) : needsLabel ? (
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
            Címke hiányzik
          </p>
        ) : null}
        {glsError ? (
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
            GLS hiba: {glsError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded border border-white/10 bg-black/40 p-4 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest admin-text-accent">Foxpost</p>
      <p className="text-[11px] text-neutral-300">
        <span className="text-white">{foxpostParcelPoint?.name}</span>
        {foxpostParcelPoint?.id ? (
          <span className="block text-neutral-500 mt-1">Automata: {foxpostParcelPoint.id}</span>
        ) : null}
      </p>
      <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
        {foxpostParcelPoint?.zip} {foxpostParcelPoint?.city} {foxpostParcelPoint?.address}
      </p>
      {foxpostParcelPoint?.findme ? (
        <p className="text-[10px] text-neutral-500">{foxpostParcelPoint.findme}</p>
      ) : null}
      {foxpostParcelPoint?.load ? (
        <p className="text-[10px] text-neutral-500">Telítettség: {foxpostParcelPoint.load}</p>
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
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
          {successMessage}
        </p>
      ) : null}
      {foxpostShipment?.clFoxId ? (
        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-300 space-y-1">
          <p>
            CLFOX: <span className="text-white">{foxpostShipment.clFoxId}</span>
          </p>
          {foxpostShipment.refCode ? (
            <p>
              Ref: <span className="text-white">{foxpostShipment.refCode}</span>
            </p>
          ) : null}
          {foxpostShipment.trackingStatus ? (
            <p>
              Státusz: <span className="text-white">{foxpostShipment.trackingStatus}</span>
            </p>
          ) : null}
          {foxpostShipment.generatedAt ? (
            <p>
              Generálva:{" "}
              <span className="text-white">
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
              className="inline-flex admin-link-accent"
            >
              Címke megnyitása
            </a>
          ) : null}
        </div>
      ) : needsLabel ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
          Csomag/címke hiányzik
        </p>
      ) : null}
      {foxpostError ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
          Foxpost hiba: {foxpostError}
        </p>
      ) : null}
    </div>
  );
}

