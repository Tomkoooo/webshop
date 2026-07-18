"use client"

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

type Props = {
  step: number
  totalSteps: number
  canProceed: boolean
  submitting?: boolean
  backLabel: string
  nextLabel: string
  quoteCta: string
  payCta: string
  payLoading: string
  onBack: () => void
  onNext: () => void
  onPay: () => void
  /** Step index (1-based) that triggers quote/review CTA instead of next. */
  reviewStep?: number
}

/**
 * Sticky bottom bar so Back / Continue stay visible throughout the booking wizard.
 */
export function BookingWizardNav({
  step,
  totalSteps,
  canProceed,
  submitting = false,
  backLabel,
  nextLabel,
  quoteCta,
  payCta,
  payLoading,
  onBack,
  onNext,
  onPay,
  reviewStep = 4,
}: Props) {
  return (
    <div className="sticky bottom-0 z-40 -mx-4 mt-8 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-0 sm:rounded-xl sm:border sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            onClick={onBack}
            disabled={submitting}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {backLabel}
          </button>
        ) : (
          <span />
        )}

        {step < totalSteps ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            disabled={submitting || !canProceed}
            onClick={onNext}
          >
            {step === reviewStep ? quoteCta : nextLabel}
            {step === reviewStep && submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="size-4" aria-hidden />
            )}
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            disabled={submitting || !canProceed}
            onClick={onPay}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {payLoading}
              </>
            ) : (
              payCta
            )}
          </button>
        )}
      </div>
    </div>
  )
}
