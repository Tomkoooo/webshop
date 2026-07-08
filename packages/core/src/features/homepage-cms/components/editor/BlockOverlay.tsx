"use client"

type Props = {
  label: string
  selected: boolean
  disabled?: boolean
}

export function BlockOverlay({ label, selected, disabled = false }: Props) {
  return (
    <div className="absolute top-2 left-2 z-20 pointer-events-none">
      <span
        className={`px-2 py-1 text-[10px] uppercase tracking-widest ${
          selected ? "bg-primary text-white" : "bg-black/70 text-white/80"
        }`}
      >
        {label} {disabled ? "(rejtett)" : ""}
      </span>
      {disabled ? <div className="mt-2 px-2 py-1 text-[10px] bg-red-950/70 text-red-200 border border-red-500/40">Kikapcsolva</div> : null}
    </div>
  )
}
