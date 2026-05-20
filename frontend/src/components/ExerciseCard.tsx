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
}: {
  card: CardWithContent
  onRate: (rating: 1 | 2 | 3 | 4) => void
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
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex flex-col items-center gap-3 py-2">
          <HebrewWord text={card.word.hebrew} size="lg" />
          <span className="text-sm text-muted-foreground italic">
            {card.word.transliteration}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        <p className="text-sm font-medium">{content.question}</p>
        <div className="flex flex-col gap-2">
          {shuffled.map((opt, i) => {
            const isSelected = selectedIdx === i
            return (
              <button
                key={i}
                onClick={() => !revealed && setSelectedIdx(i)}
                disabled={revealed}
                className={cn(
                  "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                  "disabled:pointer-events-none",
                  !revealed && "hover:bg-muted",
                  revealed && opt.isCorrect &&
                    "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200",
                  revealed && isSelected && !opt.isCorrect &&
                    "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200",
                  !revealed && "border-border bg-background",
                  revealed && !opt.isCorrect && !isSelected && "border-border bg-background opacity-50"
                )}
              >
                {opt.text}
              </button>
            )
          })}
        </div>

        {revealed && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {content.explanation}
          </p>
        )}
      </CardContent>

      {revealed && (
        <CardFooter className="flex-col gap-3 pt-4">
          <p className="self-start text-xs font-medium text-muted-foreground">
            How well did you know this?
          </p>
          <RatingBar onRate={onRate} />
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
}: {
  card: CardWithContent
  onRate: (rating: 1 | 2 | 3 | 4) => void
}) {
  const content = asFlashcard(card.content)
  const [revealed, setRevealed] = useState(false)

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex flex-col items-center gap-3 py-2">
          <HebrewWord text={card.word.hebrew} size="lg" />
          <span className="text-sm text-muted-foreground italic">
            {card.word.transliteration}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        {!revealed ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setRevealed(true)}
          >
            Reveal answer
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Meaning
              </p>
              <p className="font-medium">{card.word.gloss_pt}</p>
            </div>

            {content.example_sentence && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Example
                </p>
                <HebrewWord
                  text={content.example_sentence}
                  size="sm"
                  className="block"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  {content.translation}
                </p>
              </div>
            )}

            {content.note && (
              <p className="text-xs text-muted-foreground">{content.note}</p>
            )}
          </div>
        )}
      </CardContent>

      {revealed && (
        <CardFooter className="flex-col gap-3 pt-4">
          <p className="self-start text-xs font-medium text-muted-foreground">
            How well did you know this?
          </p>
          <RatingBar onRate={onRate} />
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
}: {
  card: CardWithContent
  onRate: (rating: 1 | 2 | 3 | 4) => void
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
      <CardHeader className="border-b">
        <div className="flex flex-col gap-1 py-2">
          <p className="font-medium">{content.prompt}</p>
          <p className="text-xs text-muted-foreground">{content.hint}</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex gap-2">
          <Input
            dir="rtl"
            lang="he"
            value={value}
            onChange={(e) => !submitted && setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !submitted && handleSubmit()}
            placeholder="Type in Hebrew…"
            disabled={submitted}
            className="font-serif text-lg"
          />
          {!submitted && (
            <Button onClick={handleSubmit} disabled={!value.trim()}>
              Check
            </Button>
          )}
        </div>

        {submitted && (
          <div
            className={cn(
              "rounded-lg border p-3 text-sm",
              isCorrect
                ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200"
                : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
            )}
          >
            {isCorrect ? (
              <p>Correct!</p>
            ) : (
              <p>
                Correct answer:{" "}
                <span dir="rtl" lang="he" className="font-serif">
                  {content.answer}
                </span>
              </p>
            )}
          </div>
        )}
      </CardContent>

      {submitted && (
        <CardFooter className="flex-col gap-3 pt-4">
          <p className="self-start text-xs font-medium text-muted-foreground">
            How well did you know this?
          </p>
          <RatingBar onRate={onRate} />
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
}

export function ExerciseCard({ card, onRate }: ExerciseCardProps) {
  // Reset internal exercise state whenever the card changes.
  // The sub-components read `card.card_id` via their own key or effects;
  // wrapping them in a keyed fragment here is the simplest safe reset.
  return (
    <div className="w-full">
      {card.format === "multiple_choice" && (
        <MultipleChoiceExercise key={card.card_id} card={card} onRate={onRate} />
      )}
      {card.format === "flashcard" && (
        <FlashcardExercise key={card.card_id} card={card} onRate={onRate} />
      )}
      {card.format === "typing" && (
        <TypingExercise key={card.card_id} card={card} onRate={onRate} />
      )}
    </div>
  )
}
