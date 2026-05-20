"use client"

import { cn } from "@/lib/utils"

interface RatingBarProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void
  disabled?: boolean
}

const RATINGS = [
  {
    value: 1 as const,
    label: "Again",
    className:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
  },
  {
    value: 2 as const,
    label: "Hard",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900",
  },
  {
    value: 3 as const,
    label: "Good",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900",
  },
  {
    value: 4 as const,
    label: "Easy",
    className:
      "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900",
  },
]

export function RatingBar({ onRate, disabled = false }: RatingBarProps) {
  return (
    <div className="flex w-full gap-2">
      {RATINGS.map(({ value, label, className }) => (
        <button
          key={value}
          onClick={() => onRate(value)}
          disabled={disabled}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
            "disabled:pointer-events-none disabled:opacity-40",
            className
          )}
        >
          <span className="text-base font-semibold leading-none">{value}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
