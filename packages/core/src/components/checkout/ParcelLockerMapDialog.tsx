"use client"

import * as React from "react"
import { cn } from "@wse/core/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { type CheckoutStepAppearance } from "@wse/core/components/checkout/checkout-appearance"

type ParcelLockerMapDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  appearance?: CheckoutStepAppearance
  children: React.ReactNode
}

function dialogChrome(appearance: CheckoutStepAppearance) {
  return appearance === "light"
    ? "border-border bg-background text-foreground"
    : "border-white/10 bg-black text-white"
}

function titleChrome(appearance: CheckoutStepAppearance) {
  return appearance === "light" ? "text-foreground font-semibold normal-case" : undefined
}

function descriptionChrome(appearance: CheckoutStepAppearance) {
  return appearance === "light" ? "text-muted-foreground" : "text-neutral-400"
}

export function cxParcelPickerTrigger(appearance: CheckoutStepAppearance) {
  return cn(
    "inline-flex w-full max-w-full items-center justify-center border px-3 py-3 text-center text-[10px] font-bold uppercase leading-snug tracking-widest transition-colors",
    "break-words hyphens-auto sm:px-4",
    appearance === "light"
      ? "rounded-lg border-border bg-card text-foreground hover:bg-muted/60"
      : "border-white/15 bg-white/5 text-primary-foreground hover:bg-white/10"
  )
}

export function ParcelLockerMapDialog({
  open,
  onOpenChange,
  title,
  description,
  appearance = "dark",
  children,
}: ParcelLockerMapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "fixed inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border p-0 shadow-2xl",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(90dvh,820px)] sm:max-h-[90dvh] sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg",
          dialogChrome(appearance)
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className={cn("text-base sm:text-lg", titleChrome(appearance))}>{title}</DialogTitle>
          {description?.trim() ? (
            <DialogDescription className={descriptionChrome(appearance)}>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-hidden",
            appearance === "light" ? "bg-muted/30" : "bg-muted/20"
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
