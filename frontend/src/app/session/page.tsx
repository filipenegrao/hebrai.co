"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { getNextCards, submitReview } from "@/lib/api"
import type { CardWithContent } from "@/lib/api"
import { ExerciseCard } from "@/components/ExerciseCard"
import { LumenEyebrow, LumenHeader, LumenPanel, LumenShell } from "@/components/LumenChrome"
import { SessionProgress } from "@/components/SessionProgress"

type SessionState = "loading" | "active" | "empty" | "complete" | "error"

export default function SessionPage() {
  const [status, setStatus] = useState<SessionState>("loading")
  const [cards, setCards] = useState<CardWithContent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalCards, setTotalCards] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
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
    if (submitting) return
    setSubmitting(true)

    const card = cards[currentIndex]
    const response_time_ms = Math.min(Date.now() - cardStartRef.current, 300_000)

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
    const reviewed = reviewedCount + 1
    setReviewedCount(reviewed)

    if (next >= cards.length) {
      setStatus("complete")
    } else {
      cardStartRef.current = Date.now()
      setCurrentIndex(next)
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <LumenShell>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-lg italic text-muted-foreground">Carregando sessão…</p>
        </div>
      </LumenShell>
    )
  }

  if (status === "error") {
    return (
      <LumenShell>
        <div className="flex min-h-screen items-center justify-center p-4">
          <LumenPanel className="w-full max-w-lg items-center gap-5 text-center">
            <LumenEyebrow>Erro de sessão</LumenEyebrow>
            <p className="text-base text-destructive">{errorMessage}</p>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full border border-[var(--lumen-hairline)] bg-[rgba(18,26,51,0.6)] px-5 text-sm italic transition-colors hover:bg-[rgba(18,26,51,0.76)]"
            >
              Voltar ao início
            </Link>
          </LumenPanel>
        </div>
      </LumenShell>
    )
  }

  if (status === "empty") {
    return (
      <LumenShell>
        <div className="flex min-h-screen items-center justify-center p-4">
          <LumenPanel className="w-full max-w-xl items-center gap-5 text-center">
            <LumenEyebrow>Sessão vazia</LumenEyebrow>
            <p className="text-lg italic text-muted-foreground">
              Nenhum cartão para revisar hoje. Volte amanhã.
            </p>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full border border-[var(--lumen-hairline)] bg-[rgba(18,26,51,0.6)] px-5 text-sm italic transition-colors hover:bg-[rgba(18,26,51,0.76)]"
            >
              Voltar ao início
            </Link>
          </LumenPanel>
        </div>
      </LumenShell>
    )
  }

  if (status === "complete") {
    const count = reviewedCount > 0 ? reviewedCount : totalCards
    return (
      <LumenShell>
        <div className="flex min-h-screen items-center justify-center p-4">
          <LumenPanel className="w-full max-w-2xl items-center gap-6 text-center">
            <LumenEyebrow>Sessão concluída</LumenEyebrow>
            <div
              dir="rtl"
              lang="he"
              className="text-7xl text-[var(--lumen-bone)] [font-family:var(--font-hebrew)] drop-shadow-[0_0_30px_rgba(229,184,95,0.22)]"
            >
              שָׁלוֹם
            </div>
            <h1 className="text-4xl font-light italic text-[var(--lumen-bone)]">
              Muito bem.
            </h1>
            <p className="max-w-lg text-lg italic text-muted-foreground">
              {count} {count === 1 ? "cartão revisado" : "cartões revisados"}.
            </p>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-full border border-[var(--lumen-gold)] bg-[rgba(229,184,95,0.12)] px-6 text-base italic text-[var(--lumen-bone)] shadow-[inset_0_0_24px_rgba(229,184,95,0.18)] transition-colors hover:bg-[rgba(229,184,95,0.18)]"
            >
              Voltar ao início
            </Link>
          </LumenPanel>
        </div>
      </LumenShell>
    )
  }

  // active
  const currentCard = cards[currentIndex]
  return (
    <LumenShell>
      <LumenHeader
        current="Sessão"
        rightSlot={
          <Link
            href="/"
            className="lumen-sc text-[10px] text-[var(--lumen-bone-muted)] transition-colors hover:text-[var(--lumen-bone)]"
          >
            Encerrar
          </Link>
        }
      />

      <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <LumenPanel className="gap-4 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <LumenEyebrow className="text-[var(--lumen-gold)]">
                  Sessão de estudo
                </LumenEyebrow>
                <p className="mt-2 text-base italic text-[var(--lumen-bone-soft)]">
                  Revele, responda e marque seu nível de domínio.
                </p>
              </div>
              <SessionProgress done={currentIndex} total={totalCards} />
            </div>
          </LumenPanel>

          {currentCard && (
            <ExerciseCard
              card={currentCard}
              onRate={handleRate}
              ratingDisabled={submitting}
            />
          )}
        </div>
      </div>
    </LumenShell>
  )
}
