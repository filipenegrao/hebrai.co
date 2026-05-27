import { LumenProgressDots } from "@/components/LumenChrome"

interface SessionProgressProps {
  done: number
  total: number
}

export function SessionProgress({ done, total }: SessionProgressProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const current = total > 0 ? Math.min(done + 1, total) : 0

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <LumenProgressDots current={current} total={total} />
        <span>
          {done} / {total} cartas
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(229,184,95,0.1)]">
        <div
          className="h-full rounded-full bg-[var(--lumen-gold)] transition-all duration-300 shadow-[0_0_14px_rgba(229,184,95,0.5)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
