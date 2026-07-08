"use client"

import type { ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"
import { Button } from "@wse/core/components/ui/button"

export function TBookWizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onSubmit,
  submitting,
  submitLabel = "Mentés",
}: {
  steps: Array<{ id: string; title: string }>
  currentStep: number
  onStepChange: (step: number) => void
  children: ReactNode
  onSubmit?: () => void
  submitting?: boolean
  submitLabel?: string
}) {
  const isLast = currentStep >= steps.length - 1

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => index < currentStep && onStepChange(index)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest border transition-colors",
                index === currentStep
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                  : index < currentStep
                    ? "border-white/20 bg-white/5 text-neutral-300 hover:border-white/40"
                    : "border-white/10 text-neutral-600"
              )}
            >
              {index + 1}. {step.title}
            </button>
          </li>
        ))}
      </ol>
      <div>{children}</div>
      <div className="flex gap-3 pt-2">
        {currentStep > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 border-white/10 text-white"
            onClick={() => onStepChange(currentStep - 1)}
          >
            ← Vissza
          </Button>
        ) : null}
        {!isLast ? (
          <Button
            type="button"
            className="flex-1 h-10 font-bold"
            onClick={() => onStepChange(currentStep + 1)}
          >
            Tovább →
          </Button>
        ) : onSubmit ? (
          <Button type="button" disabled={submitting} className="flex-1 h-10 font-bold" onClick={onSubmit}>
            {submitting ? "Mentés…" : submitLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
