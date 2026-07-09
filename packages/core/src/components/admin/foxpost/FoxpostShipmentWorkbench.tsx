"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import {
  Loader2,
  Printer,
  RefreshCw,
  Trash2,
  RotateCcw,
  FileText,
  Info,
  Download,
} from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { Input } from "@wse/core/components/ui/input";
import { AdminFormField } from "@wse/core/components/admin/AdminFormField";
import { AdminPanel } from "@wse/core/components/admin/AdminPanel";
import { adminAlertWarning, adminInputClass } from "@wse/core/lib/admin-ui";
import { orderNeedsParcelLabel } from "@wse/core/lib/parcel-locker";
import type { FoxpostLabelInfo, FoxpostParcelPoint, FoxpostShipment, FoxpostTrack } from "@wse/core/lib/foxpost";
import { FoxpostParcelPointEditor } from "@wse/core/components/admin/foxpost/FoxpostParcelPointEditor";
import {
  clearFoxpostShipmentError,
  createFoxpostReturn,
  deleteFoxpostParcel,
  downloadFoxpostDeliveryNote,
  fetchFoxpostLabelInfo,
  generateFoxpostShipment,
  refreshFoxpostTracking,
  updateFoxpostParcel,
  type FoxpostShipmentSource,
} from "@wse/core/actions/foxpost-shipment";

type ParcelActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};

type StatusMessage = {
  type: "info" | "success" | "error";
  text: string;
};

type FoxpostShipmentWorkbenchProps = {
  source: FoxpostShipmentSource;
  orderId: string;
  parcelManagerEnabled: boolean;
  foxpostParcelPoint?: FoxpostParcelPoint | null;
  foxpostShipment?: FoxpostShipment | null;
  onUpdated?: () => void;
};

function downloadBase64Pdf(base64: string, filename: string) {
  const link = document.createElement("a");
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = filename;
  link.click();
}

export function FoxpostShipmentWorkbench({
  source,
  orderId,
  parcelManagerEnabled,
  foxpostParcelPoint,
  foxpostShipment,
  onUpdated,
}: FoxpostShipmentWorkbenchProps) {
  const shipmentRef = { source, id: orderId };

  const generateAction = () => generateFoxpostShipment(shipmentRef);
  const refreshTrackingAction = () => refreshFoxpostTracking(shipmentRef);
  const updateParcelAction = (patch: {
    recipientName?: string;
    recipientPhone?: string;
    recipientEmail?: string;
    size?: string;
    comment?: string;
  }) => updateFoxpostParcel({ ...shipmentRef, patch });
  const deleteParcelAction = () => deleteFoxpostParcel(shipmentRef);
  const createReturnAction = () => createFoxpostReturn(shipmentRef);
  const fetchLabelInfoAction = () => fetchFoxpostLabelInfo(shipmentRef);
  const downloadDeliveryNoteAction = () => downloadFoxpostDeliveryNote(shipmentRef);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<ParcelActionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [suppressStoredError, setSuppressStoredError] = useState(false);
  const [contactUpdated, setContactUpdated] = useState(false);
  const [labelGenerationFailed, setLabelGenerationFailed] = useState(Boolean(foxpostShipment?.lastError));
  const [tracks, setTracks] = useState<FoxpostTrack[]>([]);
  const [labelInfo, setLabelInfo] = useState<FoxpostLabelInfo | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    size: "M",
    comment: "",
  });

  useEffect(() => {
    const handler = () => setContactUpdated(true);
    window.addEventListener(`order-contact-updated:${orderId}`, handler);
    return () => window.removeEventListener(`order-contact-updated:${orderId}`, handler);
  }, [orderId]);

  useEffect(() => {
    if (!foxpostShipment?.lastError) {
      setSuppressStoredError(false);
      return;
    }
    setLabelGenerationFailed(true);
  }, [foxpostShipment?.lastError]);

  const orderSnapshot = { foxpostParcelPoint, foxpostShipment };
  const needsLabel = orderNeedsParcelLabel(orderSnapshot);
  const storedError = suppressStoredError ? undefined : foxpostShipment?.lastError;
  const foxpostError =
    isPending || pendingAction
      ? undefined
      : lastResult?.success
        ? undefined
        : lastResult?.error || storedError;
  const hasLabelError = labelGenerationFailed;

  function runAction(
    actionLabel: string,
    action: () => Promise<ParcelActionResult>,
    options?: {
      onSuccess?: (result: ParcelActionResult) => void;
      clearStoredError?: boolean;
      successText?: string;
      marksLabelFailure?: boolean;
    }
  ) {
    setLastResult(null);
    setPendingAction(actionLabel);
    setStatusMessage({ type: "info", text: `${actionLabel}…` });
    if (options?.clearStoredError) {
      setSuppressStoredError(true);
    }

    startTransition(async () => {
      if (options?.clearStoredError) {
        await clearFoxpostShipmentError(shipmentRef);
      }

      const result = await action();
      setPendingAction(null);
      setLastResult(result);

      if (result.success) {
        setSuppressStoredError(true);
        setLabelGenerationFailed(false);
        setStatusMessage({
          type: "success",
          text: options?.successText || `${actionLabel} sikeres.`,
        });
        options?.onSuccess?.(result);
        router.refresh();
        onUpdated?.();
        return;
      }

      setSuppressStoredError(false);
      if (options?.marksLabelFailure) {
        setLabelGenerationFailed(true);
      }
      setStatusMessage({
        type: "error",
        text: result.error || `${actionLabel} sikertelen.`,
      });
    });
  }

  function runLabelGeneration(regenerate = false) {
    runAction(regenerate ? "Foxpost címke újragenerálása" : "Foxpost csomag + címke létrehozása", generateAction, {
      clearStoredError: true,
      marksLabelFailure: true,
      successText: regenerate
        ? "Foxpost címke újragenerálva — a hiba törölve."
        : "Foxpost csomag és címke elkészült.",
    });
  }

  return (
    <AdminPanel title="Foxpost" className="shadow-sm">
      <div className="space-y-2 text-sm">
        <p className="font-medium text-foreground">{foxpostParcelPoint?.name}</p>
        {foxpostParcelPoint?.id ? (
          <p className="text-muted-foreground">Automata: {foxpostParcelPoint.id}</p>
        ) : null}
        <p className="text-muted-foreground">
          {foxpostParcelPoint?.zip} {foxpostParcelPoint?.city} {foxpostParcelPoint?.address}
        </p>
        {foxpostParcelPoint?.findme ? (
          <p className="text-xs text-muted-foreground">{foxpostParcelPoint.findme}</p>
        ) : null}
        {foxpostParcelPoint?.load ? (
          <p className="text-xs text-muted-foreground">Telítettség: {foxpostParcelPoint.load}</p>
        ) : null}
      </div>

      {parcelManagerEnabled && foxpostParcelPoint?.id ? (
        <div className="flex flex-wrap gap-2">
          <FoxpostParcelPointEditor
            source={source}
            orderId={orderId}
            currentPoint={foxpostParcelPoint}
            parcelLocked={Boolean(foxpostShipment?.clFoxId)}
            disabled={isPending}
            onUpdated={onUpdated}
          />

          {!hasLabelError ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => runLabelGeneration(false)}
            >
              {isPending && pendingAction?.includes("létrehozása") ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Printer className="mr-2 size-4" />
              )}
              Foxpost csomag + címke
            </Button>
          ) : null}

          {hasLabelError ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => runLabelGeneration(true)}
              className="border-amber-500/40 text-amber-900 hover:bg-amber-500/10"
            >
              {isPending && pendingAction?.includes("újragenerálása") ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Címke újragenerálása
            </Button>
          ) : null}

          {foxpostShipment?.clFoxId ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction("Tracking frissítés", refreshTrackingAction, {
                    onSuccess: (result) => {
                      const data = result.data as { tracks?: FoxpostTrack[] } | undefined;
                      if (data?.tracks) setTracks(data.tracks);
                    },
                  })
                }
              >
                <RefreshCw className="mr-2 size-4" />
                Tracking frissítés
              </Button>

              {foxpostShipment.labelUrl ? (
                <a href={foxpostShipment.labelUrl} target="_blank" rel="noreferrer">
                  <Button type="button" variant="outline" size="sm">
                    <Download className="mr-2 size-4" />
                    Címke PDF
                  </Button>
                </a>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction("Fuvarlevél letöltése", downloadDeliveryNoteAction, {
                    onSuccess: (result) => {
                      const data = result.data as { pdfBase64?: string } | undefined;
                      if (data?.pdfBase64) {
                        downloadBase64Pdf(data.pdfBase64, `foxpost-delivery-note-${orderId}.pdf`);
                      }
                    },
                  })
                }
              >
                <FileText className="mr-2 size-4" />
                Fuvarlevél
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction("Címke információ lekérése", fetchLabelInfoAction, {
                    onSuccess: (result) => {
                      setLabelInfo(result.data as FoxpostLabelInfo);
                    },
                  })
                }
              >
                <Info className="mr-2 size-4" />
                Címke info
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  setShowUpdateForm((v) => !v);
                  setUpdateForm((prev) => ({
                    ...prev,
                    recipientName: prev.recipientName || "",
                    recipientPhone: prev.recipientPhone || "",
                    recipientEmail: prev.recipientEmail || "",
                  }));
                }}
              >
                Címzett szerkesztése
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (!window.confirm("Biztosan létrehozod a visszaküldési csomagot?")) return;
                  runAction("Visszaküldés létrehozása", createReturnAction);
                }}
              >
                <RotateCcw className="mr-2 size-4" />
                Visszaküldés
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (!window.confirm("Biztosan törlöd a Foxpost csomagot?")) return;
                  runAction("Foxpost csomag törlése", deleteParcelAction);
                }}
                className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
              >
                <Trash2 className="mr-2 size-4" />
                Csomag törlése
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {foxpostShipment?.clFoxId ? (
        <p className="text-xs text-muted-foreground">
          A csomagpont csak Foxpost csomag törlése után módosítható.
        </p>
      ) : null}

      {showUpdateForm && foxpostShipment?.clFoxId ? (
        <form
          className="grid grid-cols-1 gap-3 rounded-lg bg-muted/40 p-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            runAction("Címzett adatok frissítése", () => updateParcelAction(updateForm));
          }}
        >
          <AdminFormField label="Név">
            <Input
              value={updateForm.recipientName}
              onChange={(e) => setUpdateForm((f) => ({ ...f, recipientName: e.target.value }))}
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Telefon">
            <Input
              value={updateForm.recipientPhone}
              onChange={(e) => setUpdateForm((f) => ({ ...f, recipientPhone: e.target.value }))}
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Email">
            <Input
              value={updateForm.recipientEmail}
              onChange={(e) => setUpdateForm((f) => ({ ...f, recipientEmail: e.target.value }))}
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Méret">
            <Input
              value={updateForm.size}
              onChange={(e) => setUpdateForm((f) => ({ ...f, size: e.target.value }))}
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Megjegyzés" className="md:col-span-2">
            <Input
              value={updateForm.comment}
              onChange={(e) => setUpdateForm((f) => ({ ...f, comment: e.target.value }))}
              className={adminInputClass}
            />
          </AdminFormField>
          <Button type="submit" disabled={isPending} className="md:col-span-2">
            Frissítés mentése
          </Button>
        </form>
      ) : null}

      {hasLabelError && contactUpdated ? (
        <p className={adminAlertWarning}>
          A kapcsolati adatok frissítve — használd a „Címke újragenerálása” gombot.
        </p>
      ) : null}

      {hasLabelError && !isPending ? (
        <p className="text-xs text-muted-foreground">
          Ha hibás volt a név, email vagy telefon, előbb mentsd a kapcsolati adatokat, majd generáld újra a
          címkét.
        </p>
      ) : null}

      {statusMessage ? (
        <p
          className={
            statusMessage.type === "success"
              ? "text-sm text-emerald-800"
              : statusMessage.type === "error"
                ? "text-sm text-rose-600"
                : "animate-pulse text-sm text-sky-700"
          }
          role="status"
          aria-live="polite"
        >
          {statusMessage.text}
        </p>
      ) : null}

      {foxpostShipment?.clFoxId ? (
        <dl className="space-y-1 text-sm text-muted-foreground">
          <div>
            <dt className="inline">CLFOX: </dt>
            <dd className="inline text-foreground">{foxpostShipment.clFoxId}</dd>
          </div>
          {foxpostShipment.refCode ? (
            <div>
              <dt className="inline">Ref: </dt>
              <dd className="inline text-foreground">{foxpostShipment.refCode}</dd>
            </div>
          ) : null}
          {foxpostShipment.returnBarcode ? (
            <div>
              <dt className="inline">Visszaküldés: </dt>
              <dd className="inline text-foreground">{foxpostShipment.returnBarcode}</dd>
            </div>
          ) : null}
          {foxpostShipment.trackingStatus ? (
            <div>
              <dt className="inline">Státusz: </dt>
              <dd className="inline text-foreground">{foxpostShipment.trackingStatus}</dd>
            </div>
          ) : null}
          {foxpostShipment.generatedAt ? (
            <div>
              <dt className="inline">Generálva: </dt>
              <dd className="inline text-foreground">
                {format(new Date(foxpostShipment.generatedAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : needsLabel ? (
        <p className="text-sm text-amber-900">Csomag/címke hiányzik</p>
      ) : null}

      {tracks.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Tracking előzmények</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {tracks.map((track, index) => (
              <li key={`${track.trackId}-${index}`} className="text-xs text-muted-foreground">
                <span className="text-foreground">{track.status || "—"}</span>
                {track.statusDate ? (
                  <span className="ml-2">
                    {format(new Date(track.statusDate), "yyyy.MM.dd HH:mm", { locale: hu })}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {labelInfo ? (
        <div className="space-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Címke információ</p>
          <p>Feladó: {labelInfo.senderName}</p>
          <p>Címzett: {labelInfo.recipientName}</p>
          <p>Email: {labelInfo.recipientEmail}</p>
          <p>Telefon: {labelInfo.recipientPhone}</p>
          <p>Automata: {labelInfo.apm}</p>
          <p>Send type: {labelInfo.sendType}</p>
          {labelInfo.cod ? <p>Utánvét: {labelInfo.cod} Ft</p> : null}
        </div>
      ) : null}

      {foxpostError ? (
        <p className="text-sm text-rose-600">Foxpost hiba: {foxpostError}</p>
      ) : null}

      {source === "sandbox" ? (
        <p className="text-xs text-muted-foreground">
          Sandbox rendelés — csak teszt környezetben használd.
        </p>
      ) : null}
    </AdminPanel>
  );
}
