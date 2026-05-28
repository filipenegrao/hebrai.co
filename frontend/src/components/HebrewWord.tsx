import { cn } from "@/lib/utils"

// Unicode ranges: niqqud U+05B0–U+05BD, U+05BF, U+05C1–U+05C2, U+05C4–U+05C5, U+05C7
// Cantillation U+0591–U+05AF, maqaf U+05BE, paseq U+05C0, sof pasuq U+05C3, nun hafukha U+05C6
const NIQQUD_PATTERN = /[֑-֯־׀׃׆ְ-ׇֽֿׁׂׅׄ]/g

function stripNiqqud(text: string): string {
  return text.replace(NIQQUD_PATTERN, "")
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
} as const

interface HebrewWordProps {
  text: string
  showNiqqud?: boolean
  size?: keyof typeof sizeClasses
  className?: string
}

export function HebrewWord({
  text,
  showNiqqud = true,
  size = "md",
  className,
}: HebrewWordProps) {
  const displayText = showNiqqud ? text : stripNiqqud(text)

  return (
    <span
      dir="rtl"
      lang="he"
      className={cn(sizeClasses[size], "lumen-hebrew leading-none tracking-wide", className)}
    >
      {displayText}
    </span>
  )
}
