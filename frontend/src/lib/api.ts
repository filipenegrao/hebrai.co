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

export interface DailyStats {
  reviews_today: number;
  new_words_today: number;
  retention_rate: number;
  streak_days: number;
}

export interface UserSettings {
  preferred_provider: string;
  daily_new_limit: number;
  show_niqqud: boolean;
  timezone: string;
}

export async function getDailyStats(): Promise<DailyStats> {
  const res = await fetch("/api/stats/daily");
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

export async function getSettings(): Promise<UserSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error(`Failed to fetch settings: ${res.status}`);
  return res.json();
}

export async function updateSettings(body: UserSettings): Promise<UserSettings> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update settings: ${res.status}`);
  return res.json();
}
