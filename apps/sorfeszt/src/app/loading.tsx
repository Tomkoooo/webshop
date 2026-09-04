export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-background/85 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Betöltés"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- animated WebP loader */}
      <img
        src="/sorfeszt-pour-loading.webp"
        alt=""
        width={254}
        height={200}
        className="h-40 w-auto select-none sm:h-48"
        draggable={false}
      />
      <p className="text-sm font-medium text-muted-foreground">Betöltés…</p>
    </div>
  )
}
