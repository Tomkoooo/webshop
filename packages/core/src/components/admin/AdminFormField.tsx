"use client";

import type { ReactNode } from "react";
import { cn } from "@wse/core/lib/utils";
import { adminFieldLabel } from "@wse/core/lib/admin-ui";

type AdminFormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
};

/** Single label + control cell for aligned admin form rows. */
export function AdminFormField({ label, children, className, hint }: AdminFormFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label className={adminFieldLabel}>{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Grid for net/brutto/discount/stock/SKU rows in variant editor and similar. */
export const ADMIN_METRICS_ROW_CLASS =
  "grid grid-cols-2 gap-4 items-end sm:grid-cols-3 xl:grid-cols-4";
