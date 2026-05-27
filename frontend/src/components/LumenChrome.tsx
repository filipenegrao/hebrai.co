import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const STAR_POSITIONS = [
  [8, 16, 0.6],
  [14, 28, 0.35],
  [18, 72, 0.3],
  [22, 44, 0.45],
  [29, 11, 0.25],
  [34, 86, 0.4],
  [41, 58, 0.35],
  [47, 24, 0.3],
  [53, 76, 0.55],
  [59, 39, 0.25],
  [64, 14, 0.35],
  [68, 66, 0.45],
  [73, 88, 0.3],
  [79, 52, 0.4],
  [83, 19, 0.25],
  [88, 71, 0.35],
  [92, 33, 0.3],
] as const

const NAV_ITEMS = [
  { href: "/", label: "Painel" },
  { href: "/session", label: "Sessão" },
  { href: "/settings", label: "Configurações" },
] as const

export function LumenShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <main className={cn("lumen-shell relative min-h-screen overflow-hidden", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {STAR_POSITIONS.map(([left, top, opacity], index) => (
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-[var(--lumen-bone)]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              opacity,
              boxShadow: "0 0 12px rgba(229,184,95,0.25)",
            }}
          />
        ))}
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,169,212,0.12),transparent_58%)]" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(to_top,rgba(7,11,26,0.92),transparent)]" />
      </div>
      <div className="relative z-10">{children}</div>
    </main>
  )
}

export function LumenHeader({
  current,
  rightSlot,
}: {
  current?: string
  rightSlot?: ReactNode
}) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 pt-7 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lumen-hairline)] bg-[rgba(18,26,51,0.65)] shadow-[0_0_20px_rgba(229,184,95,0.12)]">
          <span
            dir="rtl"
            lang="he"
            className="text-lg text-[var(--lumen-gold)] [font-family:var(--font-hebrew)]"
          >
            א
          </span>
        </div>
        <div>
          <div className="lumen-sc text-[10px] text-[var(--lumen-bone-soft)]">
            hebrai.co
          </div>
          <div className="text-sm italic text-[var(--lumen-bone)]">
            Hebraico Bíblico
          </div>
        </div>
      </div>

      <nav className="hidden items-center gap-5 md:flex">
        {NAV_ITEMS.map((item) => {
          const active = item.label === current
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "lumen-sc rounded-full px-3 py-1.5 text-[10px] transition-colors",
                active
                  ? "text-[var(--lumen-gold)]"
                  : "text-[var(--lumen-bone-muted)] hover:text-[var(--lumen-bone)]"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="min-w-0">{rightSlot}</div>
    </header>
  )
}

export function LumenEyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("lumen-sc text-[10px] text-[var(--lumen-gold)]", className)}>{children}</div>
}

export function LumenPageTitle({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <h1 className="max-w-3xl text-5xl leading-none font-light italic tracking-[-0.03em] text-[var(--lumen-bone)] sm:text-6xl lg:text-7xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-2xl text-base leading-7 font-light italic text-[var(--lumen-bone-soft)] sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export function LumenPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("lumen-panel", className)}>{children}</div>
}

export function LumenMetricCard({
  title,
  value,
  subtitle,
  accent = false,
}: {
  title: string
  value: string | number
  subtitle?: ReactNode
  accent?: boolean
}) {
  return (
    <LumenPanel className="min-h-40 justify-between gap-5 px-5 py-5">
      <div className="lumen-sc text-[9px] text-[var(--lumen-bone-muted)]">{title}</div>
      <div className="space-y-2">
        <div
          className={cn(
            "text-5xl leading-none font-light tracking-[-0.04em]",
            accent ? "text-[var(--lumen-gold)] drop-shadow-[0_0_18px_rgba(229,184,95,0.28)]" : "text-[var(--lumen-bone)]"
          )}
        >
          {value}
        </div>
        {subtitle ? (
          <p className="text-sm italic text-[var(--lumen-bone-soft)]">{subtitle}</p>
        ) : null}
      </div>
    </LumenPanel>
  )
}

export function LumenProgressDots({
  current,
  total,
}: {
  current: number
  total: number
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, index) => {
          const active = index < current
          return (
            <span
              key={index}
              className={cn(
                "h-2.5 w-2.5 rounded-full border transition-all",
                active
                  ? "border-[var(--lumen-gold)] bg-[var(--lumen-gold)] shadow-[0_0_12px_rgba(229,184,95,0.55)]"
                  : "border-[var(--lumen-hairline)] bg-transparent"
              )}
            />
          )
        })}
      </div>
      <span className="lumen-sc text-[10px] text-[var(--lumen-bone-muted)]">
        {current} · {total}
      </span>
    </div>
  )
}
