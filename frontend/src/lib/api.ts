export interface Word {
  id: number;
  hebrew: string;
  transliteration: string;
  gloss_pt: string;
  morphology: Record<string, unknown>;
  frequency_rank: number | null;
  source_reference: string | null;
}

export interface CardWithContent {
  card_id: number;
  word: Word;
  format: "multiple_choice" | "flashcard" | "typing";
  content: Record<string, unknown>;
}

export interface NextCardsResponse {
  cards: CardWithContent[];
  session_size: number;
}

export interface ReviewRequest {
  card_id: number;
  rating: 1 | 2 | 3 | 4;
  format_used: "multiple_choice" | "flashcard" | "typing";
  response_time_ms?: number;
}

export interface ReviewResponse {
  next_due: string;
  new_stability: number;
  new_difficulty: number;
  new_reps: number;
}

export async function getNextCards(): Promise<NextCardsResponse> {
  const res = await fetch("/api/session/next-cards");
  if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);
  return res.json();
}

export async function submitReview(body: ReviewRequest): Promise<ReviewResponse> {
  const res = await fetch("/api/session/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`);
  return res.json();
}
