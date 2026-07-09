"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { Input } from "@wse/core/components/ui/input";
import { AdminFormField } from "@wse/core/components/admin/AdminFormField";
import { AdminPanel } from "@wse/core/components/admin/AdminPanel";
import { deriveNetFromGross, netToGross } from "@wse/core/lib/pricing";
import {
  countNumberedVariants,
  expandNumberRanges,
  rebuildNumberedVariantOptions,
  removeNumberedVariants,
  setNumberedVariantsActive,
  variantIdForNumber,
  type NumberRange,
} from "@wse/core/lib/numbered-variant-ranges";
import type { AdminVariantRow } from "@wse/core/lib/admin-product-variants";
import {
  buildBaseVariantRow,
  hasBaseVariant,
  resolveBaseVariantId,
} from "@wse/core/lib/numbered-variant-base";
import {
  applyNumberedDescriptionOverrides,
  getBaseVariant,
} from "@wse/core/lib/unique-numbered-variants";
import type { UniqueNumberedVariantsConfig } from "@wse/core/lib/unique-numbered-variants";
import { adminAlertWarning, adminInputClass } from "@wse/core/lib/admin-ui";
import { cn } from "@wse/core/lib/utils";

type Props = {
  variants: AdminVariantRow[];
  onVariantsChange: (variants: AdminVariantRow[]) => void;
  onOptionsChange: (options: { name: string; values: string[] }[]) => void;
  uniqueNumberedVariants: UniqueNumberedVariantsConfig;
  onUniqueNumberedChange?: (config: UniqueNumberedVariantsConfig) => void;
  defaultNetPrice: number;
  defaultGrossPrice?: number;
  vatPercent: number;
  onActiveVariantChange?: (variantId: string) => void;
};

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function NumberedVariantsManager({
  variants,
  onVariantsChange,
  onOptionsChange,
  uniqueNumberedVariants,
  onUniqueNumberedChange,
  defaultNetPrice,
  defaultGrossPrice,
  vatPercent,
  onActiveVariantChange,
}: Props) {
  const [bulkNetPrice, setBulkNetPrice] = useState("");
  const [bulkGrossPrice, setBulkGrossPrice] = useState("");
  const [deleteRangesJson, setDeleteRangesJson] = useState("[]");
  const [message, setMessage] = useState<string | null>(null);

  const numberedCount = useMemo(() => countNumberedVariants(variants), [variants]);
  const attributeName = uniqueNumberedVariants.attributeName || "Szám";
  const baseVariantId = resolveBaseVariantId(uniqueNumberedVariants);
  const baseVariant = useMemo(
    () => getBaseVariant({ variants, uniqueNumberedVariants }),
    [variants, uniqueNumberedVariants]
  );
  const [baseStockInput, setBaseStockInput] = useState(
    () => String(baseVariant?.stock ?? 0)
  );
  const [bulkDescriptionHtml, setBulkDescriptionHtml] = useState(
    () => uniqueNumberedVariants.descriptionHtml || ""
  );

  const addOrUpdateBaseVariant = () => {
    const stock = Math.max(0, Number(baseStockInput) || 0);
    const row = buildBaseVariantRow({
      id: baseVariantId,
      defaultNetPrice,
      defaultGrossPrice,
      stock,
    });
    const next = [...variants.filter((v) => v.id !== baseVariantId), row];
    commitVariants(
      next,
      hasBaseVariant(variants, uniqueNumberedVariants)
        ? "Alap variáns frissítve."
        : "Alap variáns hozzáadva — elfogyott sorszámok után ez marad a boltban."
    );
  };

  const commitVariants = (next: AdminVariantRow[], info: string) => {
    onVariantsChange(next);
    onOptionsChange(rebuildNumberedVariantOptions(next, attributeName));
    onActiveVariantChange?.(next.find((v) => v.isDefault)?.id || next[0]?.id || "");
    setMessage(info);
  };

  const applyNumberedPricing = () => {
    const net = parseOptionalNumber(bulkNetPrice);
    const gross = parseOptionalNumber(bulkGrossPrice);
    if (net == null && gross == null) {
      setMessage("Adj meg nettó vagy bruttó árat.");
      return;
    }
    const resolvedNet = net ?? deriveNetFromGross(gross ?? 0, vatPercent);
    const resolvedGross = gross ?? netToGross(net ?? 0, vatPercent);

    const next = variants.map((variant) => {
      if (!variant.id.startsWith("num-")) return variant;
      return {
        ...variant,
        netPrice: resolvedNet,
        grossPrice: resolvedGross,
      };
    });
    commitVariants(next, `Ár frissítve ${numberedCount} sorszámos variánson.`);
  };

  const resetNumberedPricing = () => {
    const next = variants.map((variant) => {
      if (!variant.id.startsWith("num-")) return variant;
      return {
        ...variant,
        netPrice: defaultNetPrice,
        grossPrice: defaultGrossPrice,
      };
    });
    commitVariants(next, "Sorszámos variánsok ára visszaállítva az alap termék árára.");
  };

  const deleteAllNumbered = () => {
    if (numberedCount === 0) {
      setMessage("Nincs törölhető sorszámos variáns.");
      return;
    }
    if (
      !window.confirm(
        `Biztosan törlöd mind a ${numberedCount} sorszámos variánst? A nem sorszámos variánsok megmaradnak.`
      )
    ) {
      return;
    }
    const next = removeNumberedVariants(variants, { all: true }) as AdminVariantRow[];
    commitVariants(next, `${numberedCount} sorszámos variáns törölve.`);
  };

  const setAllNumberedActive = (isActive: boolean) => {
    if (numberedCount === 0) {
      setMessage("Nincs sorszámos variáns.");
      return;
    }
    if (
      !isActive &&
      !window.confirm(
        `Kikapcsolod mind a ${numberedCount} sorszámos variánst? A boltban egyik sem lesz rendelhető.`
      )
    ) {
      return;
    }
    const next = setNumberedVariantsActive(variants, isActive, { all: true }) as AdminVariantRow[];
    commitVariants(
      next,
      isActive
        ? `${numberedCount} sorszámos variáns bekapcsolva.`
        : `${numberedCount} sorszámos variáns kikapcsolva.`
    );
  };

  const setNumberedActiveByRanges = (isActive: boolean) => {
    let ranges: NumberRange[];
    try {
      ranges = JSON.parse(deleteRangesJson) as NumberRange[];
      if (!Array.isArray(ranges) || ranges.length === 0) {
        throw new Error("Adj meg legalább egy tartományt JSON-ben.");
      }
      expandNumberRanges(ranges);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Érvénytelen tartomány JSON.");
      return;
    }
    const ids = new Set(expandNumberRanges(ranges).map((n) => variantIdForNumber(n)));
    const inRange = variants.filter((v) => ids.has(v.id)).length;
    if (inRange === 0) {
      setMessage("A megadott tartományban nem volt sorszámos variáns.");
      return;
    }
    if (
      !isActive &&
      !window.confirm(`Kikapcsolod a tartományban lévő ${inRange} sorszámos variánst?`)
    ) {
      return;
    }
    const next = setNumberedVariantsActive(variants, isActive, { ranges }) as AdminVariantRow[];
    commitVariants(
      next,
      isActive
        ? `${inRange} sorszámos variáns bekapcsolva a tartományban.`
        : `${inRange} sorszámos variáns kikapcsolva a tartományban.`
    );
  };

  const deleteByRanges = () => {
    let ranges: NumberRange[];
    try {
      ranges = JSON.parse(deleteRangesJson) as NumberRange[];
      if (!Array.isArray(ranges) || ranges.length === 0) {
        throw new Error("Adj meg legalább egy tartományt JSON-ben.");
      }
      expandNumberRanges(ranges);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Érvénytelen tartomány JSON.");
      return;
    }
    const before = numberedCount;
    const next = removeNumberedVariants(variants, { ranges }) as AdminVariantRow[];
    const after = countNumberedVariants(next);
    const removed = before - after;
    if (removed === 0) {
      setMessage("A megadott tartományban nem volt sorszámos variáns.");
      return;
    }
    if (
      !window.confirm(
        `Törlöd a tartományban lévő ${removed} sorszámos variánst? (${after} marad)`
      )
    ) {
      return;
    }
    commitVariants(next, `${removed} sorszámos variáns törölve a tartományból.`);
  };

  if (numberedCount === 0) return null;

  return (
    <div className={cn(adminAlertWarning, "space-y-6")}>
      <div>
        <p className="text-sm font-semibold text-amber-900">
          Sorszámos variáns kezelés ({numberedCount} db)
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Alap variáns és sorszámok együtt rendelhetők. Egyes variáns (leírás, ár) alul a listában — keresés sorszámra vagy „base”.
        </p>
      </div>

      <AdminPanel
        title="Leírások — sorszámos variánsok"
        description={`HTML sablon: használd a {{number}} vagy {{szam}} helyőrzőt. Alkalmazás után variánsonként szerkeszthető alul.`}
        className="bg-card p-4 shadow-sm"
      >
        <textarea
          value={bulkDescriptionHtml}
          onChange={(e) => setBulkDescriptionHtml(e.target.value)}
          rows={4}
          className={cn(adminInputClass, "resize-y py-2 font-mono text-xs")}
          placeholder="<p>A(z) {{number}}. szám példány…</p>"
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              const next = applyNumberedDescriptionOverrides(
                variants,
                bulkDescriptionHtml,
                attributeName
              ) as AdminVariantRow[];
              commitVariants(
                next,
                bulkDescriptionHtml.trim()
                  ? `Leírás alkalmazva ${numberedCount} sorszámos variánsra.`
                  : "Sorszámos variáns leírások törölve."
              );
              onUniqueNumberedChange?.({
                ...uniqueNumberedVariants,
                descriptionHtml: bulkDescriptionHtml.trim() || undefined,
              });
            }}
          >
            Leírás alkalmazása mindre
          </Button>
          {baseVariant ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onActiveVariantChange?.(baseVariant.id)}
            >
              Alap variáns szerkesztése
            </Button>
          ) : null}
        </div>
      </AdminPanel>

      <AdminPanel
        title="Alap variáns (nem sorszámozott)"
        description={`Nem sorszámozott példány — a boltban az egyedi sorszámok mellett is választható. Id: ${baseVariantId}${baseVariant ? ` · jelenleg ${baseVariant.stock ?? 0} db` : " · még nincs hozzáadva"}`}
        className="bg-emerald-500/5 p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
          <AdminFormField label="Készlet (db)">
            <Input
              type="number"
              min={0}
              value={baseStockInput}
              onChange={(e) => setBaseStockInput(e.target.value)}
              className={adminInputClass}
            />
          </AdminFormField>
          <Button type="button" onClick={addOrUpdateBaseVariant}>
            {baseVariant ? "Alap variáns mentése" : "Alap variáns hozzáadása"}
          </Button>
        </div>
      </AdminPanel>

      <AdminPanel title="Árak — összes sorszámos variáns" className="bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminFormField label="Nettó ár (Ft)">
            <Input
              type="number"
              value={bulkNetPrice}
              onChange={(e) => setBulkNetPrice(e.target.value)}
              placeholder="Pl. 5000"
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Bruttó ár (Ft)">
            <Input
              type="number"
              value={bulkGrossPrice}
              onChange={(e) => setBulkGrossPrice(e.target.value)}
              placeholder="Pl. 6350"
              className={adminInputClass}
            />
          </AdminFormField>
          <Button type="button" onClick={applyNumberedPricing}>
            Ár alkalmazása
          </Button>
          <Button type="button" variant="outline" onClick={resetNumberedPricing}>
            Alapár
          </Button>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Aktív státusz — összes sorszámos variáns"
        description="Inaktív variáns nem rendelhető a boltban. Tartomány szerint a törlésnél használt JSON mezővel."
        className="bg-card p-4 shadow-sm"
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setAllNumberedActive(false)}>
            Mind kikapcsolása
          </Button>
          <Button type="button" variant="outline" onClick={() => setAllNumberedActive(true)}>
            Mind bekapcsolása
          </Button>
          <Button type="button" variant="outline" onClick={() => setNumberedActiveByRanges(false)}>
            Tartomány kikapcsolása
          </Button>
          <Button type="button" variant="outline" onClick={() => setNumberedActiveByRanges(true)}>
            Tartomány bekapcsolása
          </Button>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Törlés"
        description={'Tartomány szerinti törlés — JSON, pl. [{"from":36,"to":46}]'}
        className="bg-card p-4 shadow-sm"
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={deleteAllNumbered} className="text-rose-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Összes sorszámos törlése
          </Button>
        </div>
        <textarea
          value={deleteRangesJson}
          onChange={(e) => setDeleteRangesJson(e.target.value)}
          rows={3}
          className={cn(adminInputClass, "resize-y py-2 font-mono text-xs")}
          spellCheck={false}
        />
        <Button type="button" variant="outline" onClick={deleteByRanges} className="text-rose-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Tartomány törlése
        </Button>
      </AdminPanel>

      {message ? <p className="text-sm text-foreground">{message}</p> : null}
    </div>
  );
}
