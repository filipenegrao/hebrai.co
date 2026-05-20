"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { getNextCards, submitReview } from "@/lib/api"
import type { CardWithContent } from "@/lib/api"
import { ExerciseCard } from "@/components/ExerciseCard"
import { SessionProgress } from "@/components/SessionProgress"
type SessionState = "loading" | "active" | "empty" | "complete" | "error"

export default function SessionPage() {
  const [status, setStatus] = useState<SessionState>("loading")
  const [cards, setCards] = useState<CardWithContent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalCards, setTotalCards] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const cardStartRef = useRef<number>(0)

  useEffect(() => {
    async function load() {
      try {
        const data = await getNextCards()
        if (data.cards.length === 0) {
          setStatus("empty")
          return
        }
        setCards(data.cards)
        setTotalCards(data.session_size)
        cardStartRef.current = Date.now()
        setStatus("active")
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Falha ao carregar a sessão."
        )
        setStatus("error")
      }
    }
    load()
  }, [])

  async function handleRate(rating: 1 | 2 | 3 | 4) {
    const card = cards[currentIndex]
    const response_time_ms = Date.now() - cardStartRef.current

    try {
      await submitReview({
        card_id: card.card_id,
        rating,
        format_used: card.format,
        response_time_ms,
      })
    } catch {
      // Non-fatal: submission failure is logged but does not block the session.
      // The FSRS state will not be updated for this card; it will reappear in a future session.
      console.error("Review submission failed — continuing session")
    }

    const next = currentIndex + 1
    if (next >= cards.length) {
      setStatus("complete")
    } else {
      cardStartRef.current = Date.now()
      setCurrentIndex(next)
    }
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando sessão…</p>
      </main>
    )
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm transition-colors hover:bg-muted"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    )
  }

  if (status === "empty") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">
            Nenhum cartão para revisar hoje. Volte amanhã!
          </p>
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm transition-colors hover:bg-muted"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    )
  }

  if (status === "complete") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold">Sessão concluída!</h1>
          <p className="text-muted-foreground">
            {totalCards} {totalCards === 1 ? "cartão revisado" : "cartões revisados"}.
          </p>
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    )
  }

  // active
  const currentCard = cards[currentIndex]
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex items-center justify-between">
          <SessionProgress done={currentIndex} total={totalCards} />
          <Link
            href="/"
            className="ml-4 shrink-0 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Sair
          </Link>
        </div>
        {currentCard && (
          <ExerciseCard card={currentCard} onRate={handleRate} />
        )}
      </div>
    </main>
  )
}
