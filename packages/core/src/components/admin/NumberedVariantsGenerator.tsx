"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WandSparkles } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { Input } from "@wse/core/components/ui/input";
import {
  ELADHATO_NUMBER_RANGES,
  expandNumberRanges,
  type NumberRange,
} from "@wse/core/lib/numbered-variant-ranges";
import { mergeNumberedVariantsIntoExisting } from "@wse/core/lib/generate-numbered-variants";
import { generateNumberedVariants } from "@wse/core/actions/admin-products";
import type { AdminVariantRow } from "@wse/core/lib/admin-product-variants";
import type { UniqueNumberedVariantsConfig } from "@wse/core/lib/unique-numbered-variants";

type Props = {
  productId?: string;
  defaultNetPrice: number;
  defaultGrossPrice?: number;
  variants: AdminVariantRow[];
  onVariantsChange: (variants: AdminVariantRow[]) => void;
  onOptionsChange: (options: { name: string; values: string[] }[]) => void;
  uniqueNumberedVariants: UniqueNumberedVariantsConfig | null;
  onUniqueNumberedChange: (config: UniqueNumberedVariantsConfig | null) => void;
  onRequireVariantChange: (required: boolean) => void;
};

const PRESET_JSON = JSON.stringify(ELADHATO_NUMBER_RANGES, null, 2);

function buildEnabledConfig(
  prev: UniqueNumberedVariantsConfig | null,
  attributeName: string,
  descriptionHtml: string,
  ranges?: NumberRange[]
): UniqueNumberedVariantsConfig {
  const numberRanges = ranges ?? prev?.numberRanges;
  return {
    enabled: true,
    attributeName: attributeName.trim() || "Szám",
    maxQuantityPerLine: prev?.maxQuantityPerLine ?? 1,
    descriptionHtml: descriptionHtml.trim() || undefined,
    baseVariantId: prev?.baseVariantId,
    ...(numberRanges?.length ? { numberRanges } : {}),
  };
}

export function NumberedVariantsGenerator({
  productId,
  defaultNetPrice,
  defaultGrossPrice,
  variants,
  onVariantsChange,
  onOptionsChange,
  uniqueNumberedVariants,
  onUniqueNumberedChange,
  onRequireVariantChange,
}: Props) {
  const router = useRouter();
  const [rangesJson, setRangesJson] = useState(() =>
    uniqueNumberedVariants?.numberRanges?.length
      ? JSON.stringify(uniqueNumberedVariants.numberRanges, null, 2)
      : PRESET_JSON
  );
  const [attributeName, setAttributeName] = useState(
    uniqueNumberedVariants?.attributeName || "Szám"
  );
  const [descriptionHtml, setDescriptionHtml] = useState(
    uniqueNumberedVariants?.descriptionHtml || ""
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (uniqueNumberedVariants?.attributeName) {
      setAttributeName(uniqueNumberedVariants.attributeName);
    }
    if (uniqueNumberedVariants?.descriptionHtml !== undefined) {
      setDescriptionHtml(uniqueNumberedVariants.descriptionHtml || "");
    }
    if (uniqueNumberedVariants?.numberRanges?.length) {
      setRangesJson(JSON.stringify(uniqueNumberedVariants.numberRanges, null, 2));
    }
  }, [
    uniqueNumberedVariants?.attributeName,
    uniqueNumberedVariants?.descriptionHtml,
    uniqueNumberedVariants?.numberRanges,
  ]);

  const syncUniqueConfig = (attr: string, desc: string) => {
    onUniqueNumberedChange(buildEnabledConfig(uniqueNumberedVariants, attr, desc));
  };

  const applyLocally = (ranges: NumberRange[]) => {
    const { variants: nextVariants, variantOptions, numbers } = mergeNumberedVariantsIntoExisting(
      variants as never[],
      {
        ranges,
        attributeName,
        netPrice: defaultNetPrice,
        grossPrice: defaultGrossPrice,
        discount: 0,
        initialStock: 1,
      }
    );
    onVariantsChange(nextVariants as AdminVariantRow[]);
    onOptionsChange(variantOptions);
    onUniqueNumberedChange(
      buildEnabledConfig(uniqueNumberedVariants, attributeName, descriptionHtml, ranges)
    );
    onRequireVariantChange(true);
    setMessage(`${numbers.length} sorszámos variáns betöltve.`);
  };

  const handleGenerate = () => {
    setMessage(null);
    let ranges: NumberRange[];
    try {
      ranges = JSON.parse(rangesJson) as NumberRange[];
      if (!Array.isArray(ranges) || ranges.length === 0) {
        throw new Error("Legalább egy tartomány szükséges.");
      }
      expandNumberRanges(ranges);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Érvénytelen tartomány JSON.");
      return;
    }

    if (productId) {
      startTransition(async () => {
        try {
          const result = await generateNumberedVariants(productId, {
            ranges,
            attributeName,
            netPrice: defaultNetPrice,
            grossPrice: defaultGrossPrice,
            enableUniqueMode: true,
            descriptionHtml: descriptionHtml.trim() || undefined,
          });
          onUniqueNumberedChange(
            buildEnabledConfig(uniqueNumberedVariants, attributeName, descriptionHtml, ranges)
          );
          setMessage(`${result.count} variáns mentve az adatbázisba.`);
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Generálás sikertelen.");
        }
      });
      return;
    }

    applyLocally(ranges);
  };

  return (
    <div className="border border-primary/30 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center gap-2 text-white">
        <WandSparkles className="h-4 w-4 text-primary" />
        <p className="text-xs font-black uppercase tracking-widest">Sorszámos (egyedi) variáns generátor</p>
      </div>
      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
        ELADHATÓ előbeállítás: 36–46, 49–76 (50 kihagyva), 79–409 — összesen 369 db, készlet 1 / variáns.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
            Attribútum neve
          </label>
          <Input
            value={attributeName}
            onChange={(e) => {
              setAttributeName(e.target.value);
              if (uniqueNumberedVariants?.enabled) {
                syncUniqueConfig(e.target.value, descriptionHtml);
              }
            }}
            className="bg-black border-white/5 h-10 text-white rounded-none"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-none uppercase tracking-widest text-xs"
            onClick={() => setRangesJson(PRESET_JSON)}
          >
            ELADHATÓ preset
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
          Leírás sorszámos variánsokhoz (opcionális)
        </label>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
          Üresen hagyva a termék alapleírása jelenik meg. Használható: {"{{number}}"} vagy {"{{szam}}"} a
          kiválasztott sorszám beillesztéséhez. HTML megengedett.
        </p>
        <textarea
          value={descriptionHtml}
          onChange={(e) => {
            setDescriptionHtml(e.target.value);
            if (uniqueNumberedVariants?.enabled) {
              syncUniqueConfig(attributeName, e.target.value);
            }
          }}
          rows={5}
          placeholder="Pl. Limitált példány, sorszám: {{number}}…"
          className="w-full bg-black border border-white/10 text-white text-sm p-3 rounded-none resize-y min-h-[100px]"
        />
      </div>

      <textarea
        value={rangesJson}
        onChange={(e) => setRangesJson(e.target.value)}
        rows={6}
        className="w-full bg-black border border-white/10 text-white text-xs font-mono p-3 rounded-none"
        spellCheck={false}
      />
      <Button
        type="button"
        disabled={isPending}
        onClick={handleGenerate}
        className="rounded-none uppercase tracking-widest text-xs font-black"
      >
        {isPending ? "Generálás…" : "Sorszám variánsok generálása"}
      </Button>
      {message ? (
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">{message}</p>
      ) : null}
    </div>
  );
}
