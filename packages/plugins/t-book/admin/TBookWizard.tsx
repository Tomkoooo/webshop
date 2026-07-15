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
      <ol className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-1">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => index < currentStep && onStepChange(index)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                index === currentStep
                  ? "bg-muted/55 text-foreground ring-1 ring-inset ring-border/25"
                  : index < currentStep
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/60"
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
            className="h-10"
            onClick={() => onStepChange(currentStep - 1)}
          >
            ← Vissza
          </Button>
        ) : null}
        {!isLast ? (
          <Button
            type="button"
            className="flex-1 h-10 font-semibold"
            onClick={() => onStepChange(currentStep + 1)}
          >
            Tovább →
          </Button>
        ) : onSubmit ? (
          <Button type="button" disabled={submitting} className="flex-1 h-10 font-semibold" onClick={onSubmit}>
            {submitting ? "Mentés…" : submitLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
