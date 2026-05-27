"use client"

import { cn } from "@/lib/utils"

interface RatingBarProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void
  disabled?: boolean
}

const RATINGS = [
  {
    value: 1 as const,
    label: "Esquecido",
    className:
      "border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/18",
  },
  {
    value: 2 as const,
    label: "Difícil",
    className:
      "border-amber-400/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/18",
  },
  {
    value: 3 as const,
    label: "Bom",
    className:
      "border-[var(--lumen-gold)]/45 bg-[rgba(229,184,95,0.12)] text-[var(--lumen-bone)] hover:bg-[rgba(229,184,95,0.18)]",
  },
  {
    value: 4 as const,
    label: "Fácil",
    className:
      "border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/18",
  },
]

export function RatingBar({ onRate, disabled = false }: RatingBarProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
      {RATINGS.map(({ value, label, className }) => (
        <button
          key={value}
          type="button"
          onClick={() => onRate(value)}
          disabled={disabled}
          className={cn(
            "flex min-h-20 flex-col items-center justify-center gap-1 rounded-[22px] border px-3 py-3 text-center text-xs font-medium transition-colors",
            "disabled:pointer-events-none disabled:opacity-40",
            className
          )}
        >
          <span className="text-lg font-semibold leading-none">{value}</span>
          <span className="italic">{label}</span>
        </button>
      ))}
    </div>
  )
}
