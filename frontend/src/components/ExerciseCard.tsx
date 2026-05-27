"use client"

import { useState } from "react"
import type { CardWithContent } from "@/lib/api"
import { HebrewWord } from "./HebrewWord"
import { RatingBar } from "./RatingBar"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Typed content helpers — content arrives as Record<string, unknown>
// ---------------------------------------------------------------------------

interface MultipleChoiceContent {
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

interface FlashcardContent {
  example_sentence: string
  translation: string
  note: string
}

interface TypingContent {
  prompt: string
  answer: string
  hint: string
}

function providerLabel(provider: string | null): string | null {
  if (!provider) return null
  if (provider === "claude") return "Gerado com Claude"
  if (provider === "gemini") return "Gerado com Gemini"
  if (provider === "gpt-4o") return "Gerado com OpenAI"
  if (provider === "ollama") return "Gerado localmente"
  return `Gerado com ${provider}`
}

function AiProviderBadge({ provider }: { provider: string | null }) {
  const label = providerLabel(provider)
  if (!label) return null

  return (
    <span className="inline-flex w-fit rounded-full border border-[var(--lumen-hairline)] bg-[rgba(229,184,95,0.08)] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-[var(--lumen-gold)] uppercase">
      {label}
    </span>
  )
}

function asMultipleChoice(c: Record<string, unknown>): MultipleChoiceContent {
  return {
    question: String(c.question ?? ""),
    options: Array.isArray(c.options) ? c.options.map(String) : [],
    correct_index: typeof c.correct_index === "number" ? c.correct_index : 0,
    explanation: String(c.explanation ?? ""),
  }
}

function asFlashcard(c: Record<string, unknown>): FlashcardContent {
  return {
    example_sentence: String(c.example_sentence ?? ""),
    translation: String(c.translation ?? ""),
    note: String(c.note ?? ""),
  }
}

function asTyping(c: Record<string, unknown>): TypingContent {
  return {
    prompt: String(c.prompt ?? ""),
    answer: String(c.answer ?? ""),
    hint: String(c.hint ?? ""),
  }
}

// ---------------------------------------------------------------------------
// Multiple-choice exercise
// ---------------------------------------------------------------------------

function MultipleChoiceExercise({
  card,
  onRate,
  ratingDisabled,
}: {
  card: CardWithContent
  onRate: (rating: 1 | 2 | 3 | 4) => void
  ratingDisabled?: boolean
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const revealed = selectedIdx !== null

  // Shuffle options once on mount. Sub-components are keyed by card_id in
  // ExerciseCard, so a new card remounts this component and re-runs the initializer.
  const [shuffled] = useState(() => {
    const content = asMultipleChoice(card.content)
    const opts = content.options.map((text, i) => ({
      text,
      isCorrect: i === content.correct_index,
    }))
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opts[i], opts[j]] = [opts[j], opts[i]]
    }
    return opts
  })

  const content = asMultipleChoice(card.content)

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="border-b border-[var(--lumen-hairline-soft)] pb-8">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="lumen-sc text-[10px] text-[var(--lumen-gold)]">
            Sessão ativa
          </span>
          <div className="rounded-full bg-[radial-gradient(circle,rgba(229,184,95,0.18),transparent_68%)] px-12 py-8">
            <HebrewWord
              text={card.word.hebrew}
              size="xl"
              className="lumen-hebrew-glow"
            />
          </div>
          <span className="text-lg text-muted-foreground italic">
            {card.word.transliteration}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-6">
        <p className="text-2xl leading-tight font-light italic text-[var(--lumen-bone)]">
          {content.question}
        </p>
        <div className="flex flex-col gap-2">
          {shuffled.map((opt, i) => {
            const isSelected = selectedIdx === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => !revealed && setSelectedIdx(i)}
                disabled={revealed}
                className={cn(
                  "grid w-full grid-cols-[32px_1fr] items-center gap-4 rounded-[24px] border px-5 py-4 text-left text-base italic transition-colors",
                  "disabled:pointer-events-none",
                  !revealed && "bg-[rgba(18,26,51,0.45)] hover:bg-[rgba(18,26,51,0.62)]",
                  revealed && opt.isCorrect &&
                    "border-[var(--lumen-gold)] bg-[rgba(229,184,95,0.12)] text-[var(--lumen-bone)] shadow-[0_0_24px_rgba(229,184,95,0.16)]",
                  revealed && isSelected && !opt.isCorrect &&
                    "border-red-400/30 bg-red-500/10 text-red-100",
                  !revealed && "border-[var(--lumen-hairline-soft)] text-[var(--lumen-bone)]",
                  revealed && !opt.isCorrect && !isSelected && "border-[var(--lumen-hairline-soft)] bg-[rgba(18,26,51,0.3)] text-[var(--lumen-bone-muted)] opacity-60"
                )}
              >
                <span className="lumen-sc text-[11px] text-[var(--lumen-gold)]">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt.text}</span>
              </button>
            )
          })}
        </div>

        {revealed && (
          <div className="space-y-2">
            <AiProviderBadge provider={card.ai_provider} />
            <p className="rounded-[22px] border border-[var(--lumen-hairline-soft)] bg-[rgba(18,26,51,0.45)] px-4 py-3 text-sm italic text-muted-foreground">
              {content.explanation}
            </p>
          </div>
        )}
      </CardContent>

      {revealed && (
        <CardFooter className="flex-col gap-4 border-[var(--lumen-hairline-soft)] pt-5">
          <p className="self-start text-xs font-medium italic text-muted-foreground">
            Qual era seu nível de conhecimento?
          </p>
          <RatingBar onRate={onRate} disabled={ratingDisabled} />
        </CardFooter>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Flashcard exercise
// ---------------------------------------------------------------------------

function FlashcardExercise({
  card,
  onRate,
  ratingDisabled,
}: {
  card: CardWithContent
  onRate: (rating: 1 | 2 | 3 | 4) => void
  ratingDisabled?: boolean
}) {
  const content = asFlashcard(card.content)
  const [revealed, setRevealed] = useState(false)

  return (
    <Card className="w-full">
      <CardHeader className="border-b border-[var(--lumen-hairline-soft)] pb-8">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="lumen-sc text-[10px] text-[var(--lumen-gold)]">
            Flashcard
          </span>
          <div className="rounded-full bg-[radial-gradient(circle,rgba(229,184,95,0.18),transparent_68%)] px-12 py-8">
            <HebrewWord
              text={card.word.hebrew}
              size="xl"
              className="lumen-hebrew-glow"
            />
          </div>
          <span className="text-lg text-muted-foreground italic">
            {card.word.transliteration}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-6">
        {!revealed ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setRevealed(true)}
          >
            Revelar resposta
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-[24px] border border-[var(--lumen-hairline-soft)] bg-[rgba(18,26,51,0.45)] p-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Significado
              </p>
              <p className="text-xl italic text-[var(--lumen-bone)]">{card.word.gloss_pt}</p>
            </div>

            {content.example_sentence && (
              <div className="rounded-[24px] border border-[var(--lumen-hairline-soft)] bg-[rgba(18,26,51,0.45)] p-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Exemplo
                </p>
                <HebrewWord
                  text={content.example_sentence}
                  size="sm"
                  className="lumen-hebrew-glow block"
                />
                <p className="mt-3 text-sm italic text-muted-foreground">
                  {content.translation}
                </p>
              </div>
            )}

            {content.note && (
              <div className="space-y-2">
                <AiProviderBadge provider={card.ai_provider} />
                <p className="text-xs text-muted-foreground">{content.note}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {revealed && (
        <CardFooter className="flex-col gap-4 border-[var(--lumen-hairline-soft)] pt-5">
          <p className="self-start text-xs font-medium italic text-muted-foreground">
            Qual era seu nível de conhecimento?
          </p>
          <RatingBar onRate={onRate} disabled={ratingDisabled} />
        </CardFooter>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Typing exercise
// ---------------------------------------------------------------------------

function TypingExercise({
  card,
  onRate,
  ratingDisabled,
}: {
  card: CardWithContent
  onRate: (rating: 1 | 2 | 3 | 4) => void
  ratingDisabled?: boolean
}) {
  const content = asTyping(card.content)
  const [value, setValue] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = submitted
    ? value.trim() === content.answer.trim()
    : false

  function handleSubmit() {
    if (value.trim()) setSubmitted(true)
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b border-[var(--lumen-hairline-soft)] pb-6">
        <div className="flex flex-col gap-2 py-5">
          <span className="lumen-sc text-[10px] text-[var(--lumen-gold)]">
            Digitação
          </span>
          <p className="text-3xl leading-tight font-light italic text-[var(--lumen-bone)]">
            {content.prompt}
          </p>
          <p className="text-sm italic text-muted-foreground">{content.hint}</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex gap-2">
          <Input
            dir="rtl"
            lang="he"
            value={value}
            onChange={(e) => !submitted && setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !submitted && handleSubmit()}
            placeholder="Digite em hebraico…"
            disabled={submitted}
            className="h-14 [font-family:var(--font-hebrew)] text-2xl"
          />
          {!submitted && (
            <Button type="button" onClick={handleSubmit} disabled={!value.trim()} className="shrink-0">
              Verificar
            </Button>
          )}
        </div>

        {submitted && (
          <div className="space-y-2">
            <AiProviderBadge provider={card.ai_provider} />
            <div
              className={cn(
                "rounded-[22px] border p-4 text-base italic",
                isCorrect
                  ? "border-[var(--lumen-gold)] bg-[rgba(229,184,95,0.12)] text-[var(--lumen-bone)]"
                  : "border-red-400/30 bg-red-500/10 text-red-100"
              )}
            >
              {isCorrect ? (
                <p>Correto!</p>
              ) : (
                <p>
                  Resposta correta:{" "}
                  <span dir="rtl" lang="he" className="[font-family:var(--font-hebrew)]">
                    {content.answer}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {submitted && (
        <CardFooter className="flex-col gap-4 border-[var(--lumen-hairline-soft)] pt-5">
          <p className="self-start text-xs font-medium italic text-muted-foreground">
            Qual era seu nível de conhecimento?
          </p>
          <RatingBar onRate={onRate} disabled={ratingDisabled} />
        </CardFooter>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ExerciseCard — public API
// ---------------------------------------------------------------------------

export interface ExerciseCardProps {
  card: CardWithContent
  onRate: (rating: 1 | 2 | 3 | 4) => void
  ratingDisabled?: boolean
}

export function ExerciseCard({ card, onRate, ratingDisabled }: ExerciseCardProps) {
  return (
    <div className="w-full">
      {card.format === "multiple_choice" && (
        <MultipleChoiceExercise key={card.card_id} card={card} onRate={onRate} ratingDisabled={ratingDisabled} />
      )}
      {card.format === "flashcard" && (
        <FlashcardExercise key={card.card_id} card={card} onRate={onRate} ratingDisabled={ratingDisabled} />
      )}
      {card.format === "typing" && (
        <TypingExercise key={card.card_id} card={card} onRate={onRate} ratingDisabled={ratingDisabled} />
      )}
      {card.format !== "multiple_choice" &&
        card.format !== "flashcard" &&
        card.format !== "typing" && (
          <Card className="w-full">
            <CardContent className="pt-6">
              <p className="text-sm italic text-muted-foreground">
                Formato de exercício desconhecido.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
