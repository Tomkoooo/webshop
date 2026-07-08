"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@wse/core/components/ui/dialog";
import { Button } from "@wse/core/components/ui/button";
import { cn } from "@wse/core/lib/utils";
import { mediaImageSrc } from "@wse/core/lib/images";

export type MediaLightboxItem = {
  src: string;
  alt: string;
};

type MediaLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: MediaLightboxItem[];
  index: number;
  onIndexChange?: (index: number) => void;
};

export function MediaLightbox({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
}: MediaLightboxProps) {
  const safeIndex = images.length > 0 ? Math.min(Math.max(0, index), images.length - 1) : 0;
  const current = images[safeIndex];
  const hasMultiple = images.length > 1;

  const go = useCallback(
    (delta: number) => {
      if (!onIndexChange || images.length < 2) return;
      const next = (safeIndex + delta + images.length) % images.length;
      onIndexChange(next);
    },
    [images.length, onIndexChange, safeIndex]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, go]);

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-[min(96vw,56rem)] gap-0 overflow-hidden border-border bg-background p-0",
          "translate-y-[-50%] sm:max-w-[min(92vw,52rem)]"
        )}
      >
        <DialogTitle className="sr-only">{current.alt}</DialogTitle>
        <DialogDescription className="sr-only">
          Nagyított kép megtekintése. Bal és jobb nyíl: előző, következő kép.
        </DialogDescription>

        <div className="relative flex min-h-[12rem] w-full items-center justify-center bg-muted/40 px-4 py-10 sm:px-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaImageSrc(current.src)}
            alt={current.alt}
            className="max-h-[min(80vh,720px)] w-auto max-w-full object-contain"
            draggable={false}
          />

          {hasMultiple && onIndexChange ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Előző kép"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-border bg-background/90 text-foreground hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Következő kép"
                onClick={() => go(1)}
                className="absolute right-12 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-border bg-background/90 text-foreground hover:bg-muted"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          ) : null}
        </div>

        {hasMultiple ? (
          <p className="border-t border-border px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {safeIndex + 1} / {images.length}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type UseMediaLightboxOptions = {
  images: MediaLightboxItem[];
  initialIndex?: number;
};

export function useMediaLightbox({ images, initialIndex = 0 }: UseMediaLightboxOptions) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(initialIndex);

  const openAt = useCallback(
    (nextIndex: number) => {
      if (images.length === 0) return;
      setIndex(Math.min(Math.max(0, nextIndex), images.length - 1));
      setOpen(true);
    },
    [images.length]
  );

  return { open, setOpen, index, setIndex, openAt };
}
