"use client";

import { ZoomIn } from "lucide-react";
import { cn } from "@wse/core/lib/utils";

type MediaZoomButtonProps = {
  onClick: () => void;
  className?: string;
  label?: string;
};

export function MediaZoomButton({
  onClick,
  className,
  label = "Kép nagyítása",
}: MediaZoomButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={cn(
        "absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full",
        "border border-border/80 bg-background/90 text-foreground shadow-sm",
        "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
        "hover:bg-muted",
        className
      )}
    >
      <ZoomIn className="h-4 w-4" />
    </button>
  );
}
