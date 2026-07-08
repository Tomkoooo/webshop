"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { Input } from "@wse/core/components/ui/input";
import { AdminFormField } from "@wse/core/components/admin/AdminFormField";
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
    <div className="border border-amber-500/25 bg-amber-500/5 p-4 space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-amber-200">
          Sorszámos variáns kezelés ({numberedCount} db)
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Alap variáns és sorszámok együtt rendelhetők. Egyes variáns (leírás, ár) alul a listában — keresés sorszámra vagy „base”.
        </p>
      </div>

      <div className="border border-white/10 p-4 space-y-3">
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
          Leírások — sorszámos variánsok
        </p>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
          HTML sablon: használd a {`{{number}}`} vagy {`{{szam}}`} helyőrzőt. Alkalmazás után variánsonként szerkeszthető alul.
        </p>
        <textarea
          value={bulkDescriptionHtml}
          onChange={(e) => setBulkDescriptionHtml(e.target.value)}
          rows={4}
          className="w-full bg-black border border-white/10 text-white text-xs font-mono p-3 rounded-none resize-y"
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
            className="rounded-none bg-primary text-white font-black uppercase tracking-widest text-[10px]"
          >
            Leírás alkalmazása mindre
          </Button>
          {baseVariant ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onActiveVariantChange?.(baseVariant.id)}
              className="rounded-none border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
            >
              Alap variáns szerkesztése
            </Button>
          ) : null}
        </div>
      </div>

      <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em]">
          Alap variáns (nem sorszámozott)
        </p>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">
          Nem sorszámozott példány — a boltban az egyedi sorszámok mellett is választható; ha minden sorszám elfogyott, csak ez marad.
          Id: <span className="text-white">{baseVariantId}</span>
          {baseVariant ? ` · jelenleg ${baseVariant.stock ?? 0} db` : " · még nincs hozzáadva"}
        </p>
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
          <AdminFormField label="Készlet (db)">
            <Input
              type="number"
              min={0}
              value={baseStockInput}
              onChange={(e) => setBaseStockInput(e.target.value)}
              className="h-11 w-full rounded-none border-white/5 bg-black text-white"
            />
          </AdminFormField>
          <Button
            type="button"
            onClick={addOrUpdateBaseVariant}
            className="h-11 rounded-none bg-primary text-white font-black uppercase tracking-widest text-[10px]"
          >
            {baseVariant ? "Alap variáns mentése" : "Alap variáns hozzáadása"}
          </Button>
        </div>
      </div>

      <div className="border border-white/10 p-4 space-y-3">
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
          Árak — összes sorszámos variáns
        </p>
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminFormField label="Nettó ár (Ft)">
            <Input
              type="number"
              value={bulkNetPrice}
              onChange={(e) => setBulkNetPrice(e.target.value)}
              placeholder="Pl. 5000"
              className="h-11 w-full rounded-none border-white/5 bg-black text-white"
            />
          </AdminFormField>
          <AdminFormField label="Bruttó ár (Ft)">
            <Input
              type="number"
              value={bulkGrossPrice}
              onChange={(e) => setBulkGrossPrice(e.target.value)}
              placeholder="Pl. 6350"
              className="h-11 w-full rounded-none border-white/5 bg-black text-white"
            />
          </AdminFormField>
          <Button
            type="button"
            onClick={applyNumberedPricing}
            className="h-11 rounded-none bg-primary text-white font-black uppercase tracking-widest text-[10px]"
          >
            Ár alkalmazása
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetNumberedPricing}
            className="h-11 rounded-none border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
          >
            Alapár
          </Button>
        </div>
      </div>

      <div className="border border-white/10 p-4 space-y-3">
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
          Aktív státusz — összes sorszámos variáns
        </p>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
          Inaktív variáns nem rendelhető a boltban. Tartomány szerint a törlésnél használt JSON mezővel.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setAllNumberedActive(false)}
            className="rounded-none border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
          >
            Mind kikapcsolása
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAllNumberedActive(true)}
            className="rounded-none border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest"
          >
            Mind bekapcsolása
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setNumberedActiveByRanges(false)}
            className="rounded-none border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
          >
            Tartomány kikapcsolása
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setNumberedActiveByRanges(true)}
            className="rounded-none border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest"
          >
            Tartomány bekapcsolása
          </Button>
        </div>
      </div>

      <div className="border border-white/10 p-4 space-y-3">
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
          Törlés
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={deleteAllNumbered}
            className="rounded-none border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Összes sorszámos törlése
          </Button>
        </div>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
          Tartomány szerinti törlés — JSON, pl. [{`{"from":36,"to":46}`}]
        </p>
        <textarea
          value={deleteRangesJson}
          onChange={(e) => setDeleteRangesJson(e.target.value)}
          rows={3}
          className="w-full bg-black border border-white/10 text-white text-xs font-mono p-3 rounded-none"
          spellCheck={false}
        />
        <Button
          type="button"
          variant="outline"
          onClick={deleteByRanges}
          className="rounded-none border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Tartomány törlése
        </Button>
      </div>

      {message ? (
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">{message}</p>
      ) : null}
    </div>
  );
}
