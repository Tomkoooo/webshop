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
import { Label } from "@wse/core/components/ui/label";
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
    <div className="rounded border border-white/10 bg-black/40 p-4 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest admin-text-accent">Foxpost</p>

      <div className="space-y-2">
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
              disabled={isPending}
              onClick={() => runLabelGeneration(false)}
              className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
            >
              {isPending && pendingAction?.includes("létrehozása") ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              Foxpost csomag + címke
            </Button>
          ) : null}

          {hasLabelError ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => runLabelGeneration(true)}
              className="h-10 border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 rounded-none uppercase tracking-widest text-[10px] font-black"
            >
              {isPending && pendingAction?.includes("újragenerálása") ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Címke újragenerálása
            </Button>
          ) : null}

          {foxpostShipment?.clFoxId ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction("Tracking frissítés", refreshTrackingAction, {
                    onSuccess: (result) => {
                      const data = result.data as { tracks?: FoxpostTrack[] } | undefined;
                      if (data?.tracks) setTracks(data.tracks);
                    },
                  })
                }
                className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tracking frissítés
              </Button>

              {foxpostShipment.labelUrl ? (
                <a href={foxpostShipment.labelUrl} target="_blank" rel="noreferrer">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Címke PDF
                  </Button>
                </a>
              ) : null}

              <Button
                type="button"
                variant="outline"
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
                className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
              >
                <FileText className="w-4 h-4 mr-2" />
                Fuvarlevél
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction("Címke információ lekérése", fetchLabelInfoAction, {
                    onSuccess: (result) => {
                      setLabelInfo(result.data as FoxpostLabelInfo);
                    },
                  })
                }
                className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
              >
                <Info className="w-4 h-4 mr-2" />
                Címke info
              </Button>

              <Button
                type="button"
                variant="outline"
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
                className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
              >
                Címzett szerkesztése
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  if (!window.confirm("Biztosan létrehozod a visszaküldési csomagot?")) return;
                  runAction("Visszaküldés létrehozása", createReturnAction);
                }}
                className="h-10 admin-action-outline rounded-none uppercase tracking-widest text-[10px] font-black"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Visszaküldés
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  if (!window.confirm("Biztosan törlöd a Foxpost csomagot?")) return;
                  runAction("Foxpost csomag törlése", deleteParcelAction);
                }}
                className="h-10 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-none uppercase tracking-widest text-[10px] font-black"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Csomag törlése
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {foxpostShipment?.clFoxId ? (
        <p className="text-[10px] text-neutral-500">
          A csomagpont csak Foxpost csomag törlése után módosítható.
        </p>
      ) : null}

      {showUpdateForm && foxpostShipment?.clFoxId ? (
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-white/10 bg-black/30"
          onSubmit={(event) => {
            event.preventDefault();
            runAction("Címzett adatok frissítése", () => updateParcelAction(updateForm));
          }}
        >
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Név</Label>
            <Input
              value={updateForm.recipientName}
              onChange={(e) => setUpdateForm((f) => ({ ...f, recipientName: e.target.value }))}
              className="h-10 rounded-none bg-black border-white/10"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Telefon</Label>
            <Input
              value={updateForm.recipientPhone}
              onChange={(e) => setUpdateForm((f) => ({ ...f, recipientPhone: e.target.value }))}
              className="h-10 rounded-none bg-black border-white/10"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Email</Label>
            <Input
              value={updateForm.recipientEmail}
              onChange={(e) => setUpdateForm((f) => ({ ...f, recipientEmail: e.target.value }))}
              className="h-10 rounded-none bg-black border-white/10"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Méret</Label>
            <Input
              value={updateForm.size}
              onChange={(e) => setUpdateForm((f) => ({ ...f, size: e.target.value }))}
              className="h-10 rounded-none bg-black border-white/10"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500">Megjegyzés</Label>
            <Input
              value={updateForm.comment}
              onChange={(e) => setUpdateForm((f) => ({ ...f, comment: e.target.value }))}
              className="h-10 rounded-none bg-black border-white/10"
            />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-none md:col-span-2 uppercase tracking-widest text-[10px] font-black"
          >
            Frissítés mentése
          </Button>
        </form>
      ) : null}

      {hasLabelError && contactUpdated ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
          A kapcsolati adatok frissítve — használd a „Címke újragenerálása” gombot.
        </p>
      ) : null}

      {hasLabelError && !isPending ? (
        <p className="text-[10px] text-neutral-500">
          Ha hibás volt a név, email vagy telefon, előbb mentsd a kapcsolati adatokat, majd generáld újra a
          címkét.
        </p>
      ) : null}

      {statusMessage ? (
        <p
          className={
            statusMessage.type === "success"
              ? "text-[10px] font-black uppercase tracking-widest text-emerald-400"
              : statusMessage.type === "error"
                ? "text-[10px] font-black uppercase tracking-widest text-rose-400"
                : "text-[10px] font-black uppercase tracking-widest text-sky-400 animate-pulse"
          }
          role="status"
          aria-live="polite"
        >
          {statusMessage.text}
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
          {foxpostShipment.returnBarcode ? (
            <p>
              Visszaküldés: <span className="text-white">{foxpostShipment.returnBarcode}</span>
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
                {format(new Date(foxpostShipment.generatedAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
              </span>
            </p>
          ) : null}
        </div>
      ) : needsLabel ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Csomag/címke hiányzik</p>
      ) : null}

      {tracks.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Tracking előzmények</p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {tracks.map((track, index) => (
              <li key={`${track.trackId}-${index}`} className="text-[10px] text-neutral-400">
                <span className="text-white">{track.status || "—"}</span>
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
        <div className="space-y-1 pt-2 border-t border-white/10 text-[10px] text-neutral-400">
          <p className="font-black uppercase tracking-widest text-neutral-300">Címke információ</p>
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
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Foxpost hiba: {foxpostError}</p>
      ) : null}

      {source === "sandbox" ? (
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest">
          Sandbox rendelés — csak teszt környezetben használd.
        </p>
      ) : null}
    </div>
  );
}
