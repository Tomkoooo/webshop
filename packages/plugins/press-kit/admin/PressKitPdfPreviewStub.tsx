"use client"

import { FileText } from "lucide-react"

type Props = {
  pdfMediaFilename: string
}

export function PressKitPdfPreviewStub({ pdfMediaFilename }: Props) {
  if (!pdfMediaFilename) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10 border border-dashed border-muted-foreground/30 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          Nincs PDF feltöltve — a bal oldali panelben tölts fel egy képregény PDF-et.
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 space-y-4">
      <h2 className="text-2xl font-semibold">Digitális előnézet</h2>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-8 text-muted-foreground">
        <FileText className="h-8 w-8 shrink-0 opacity-60" />
        <div className="text-sm">
          <p className="font-medium text-foreground">PDF előnézet (szerkesztői helykitöltő)</p>
          <p className="mt-1">
            Fájl: <span className="font-mono text-xs">{pdfMediaFilename}</span>
          </p>
          <p className="mt-2 text-xs">
            A védett lapozó csak az éles sajtóportálon jelenik meg bejelentkezés után.
          </p>
        </div>
      </div>
    </section>
  )
}
