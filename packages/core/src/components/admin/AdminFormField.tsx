"use client";

import type { ReactNode } from "react";
import { cn } from "@wse/core/lib/utils";

type AdminFormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

/** Single label + control cell for aligned admin metric rows. */
export function AdminFormField({ label, children, className }: AdminFormFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label className="block text-[10px] font-black uppercase leading-tight tracking-widest text-neutral-500">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Grid for net/brutto/discount/stock/SKU rows in variant editor and similar. */
export const ADMIN_METRICS_ROW_CLASS =
  "grid grid-cols-2 gap-3 items-end sm:grid-cols-3 xl:grid-cols-6";
