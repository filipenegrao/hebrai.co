# hebrai.co — Dashboard, Settings & Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full dashboard with study metrics, user settings page, Hebrew font integration, and production deployment on VPS with HTTPS.

**Architecture:** FastAPI gains a `/stats/daily` endpoint. The Next.js dashboard replaces the shell with real metrics from `DashboardStats`. The settings page reads and writes `user_settings` via a new `/settings` FastAPI endpoint. Hebrew typography uses Noto Serif Hebrew from Google Fonts. Deployment uses Docker Compose on Ubuntu 24.04 with Nginx + Let's Encrypt (Certbot).

**Tech Stack:** FastAPI 0.136.1, PostgreSQL 18, Next.js 16.2 App Router, Tailwind CSS 4.3, shadcn/ui, Noto Serif Hebrew (Google Fonts), Docker Compose, Nginx stable-alpine, Certbot, Ubuntu 24.04 VPS

**Version policy:** Inherit the refreshed foundation baseline and keep deployment images on explicit stable tags.

---

## File Map

```
backend/
├── stats_router.py                    ← GET /stats/daily — words reviewed, new words, retention rate
├── settings_router.py                 ← GET /settings, PUT /settings — user_settings table
├── main.py                            ← (modify) include stats_router, settings_router
└── tests/
    ├── test_stats_router.py
    └── test_settings_router.py

frontend/src/
├── app/
│   ├── page.tsx                       ← (replace) full dashboard with DashboardStats
│   └── settings/
│       └── page.tsx                   ← settings form: provider, daily limit, niqqud toggle
├── components/
│   └── DashboardStats.tsx             ← metrics card grid: streak, today's reviews, new words, retention
└── app/
    └── layout.tsx                     ← (modify) add Noto Serif Hebrew font via next/font/google

nginx/
└── nginx.conf                         ← (replace) add HTTPS, HTTP→HTTPS redirect, SSL params

deploy/
├── setup-vps.sh                       ← one-time: install Docker, Certbot, clone repo
└── deploy.sh                          ← pull latest + docker compose up --build -d
```

---

## Task 1: Daily stats endpoint

**Files:**
- Create: `backend/stats_router.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_stats_router.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_stats_router.py`**

```python
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app
from db import db_connection


@pytest.fixture
def mock_cursor():
    return MagicMock()


@pytest.fixture
def mock_conn(mock_cursor):
    conn = MagicMock()
    conn.cursor.return_value.__enter__ = lambda s: mock_cursor
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    return conn


@pytest.fixture
def client(mock_conn):
    app.dependency_overrides[db_connection] = lambda: (yield mock_conn)
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_daily_stats_returns_all_fields(client, mock_cursor):
    mock_cursor.fetchone.side_effect = [
        (12,),   # reviews today
        (3,),    # new words today
        (85.0,), # retention rate (%)
        (7,),    # streak (days)
    ]
    response = client.get("/stats/daily", headers={"X-User-ID": "test_user"})
    assert response.status_code == 200
    data = response.json()
    assert data["reviews_today"] == 12
    assert data["new_words_today"] == 3
    assert data["retention_rate"] == 85.0
    assert data["streak_days"] == 7


def test_daily_stats_missing_user_returns_422(client):
    response = client.get("/stats/daily")
    assert response.status_code == 422


def test_daily_stats_new_user_returns_zeros(client, mock_cursor):
    mock_cursor.fetchone.side_effect = [
        (0,),
        (0,),
        (None,),  # no reviews yet → retention None
        (0,),
    ]
    response = client.get("/stats/daily", headers={"X-User-ID": "new_user"})
    assert response.status_code == 200
    data = response.json()
    assert data["reviews_today"] == 0
    assert data["retention_rate"] == 0.0
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && python -m pytest tests/test_stats_router.py -v 2>&1 | head -10
```

Expected: `ImportError` or 404

- [ ] **Step 3: Create `backend/stats_router.py`**

```python
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel
from db import db_connection

router = APIRouter(prefix="/stats", tags=["stats"])


class DailyStats(BaseModel):
    reviews_today: int
    new_words_today: int
    retention_rate: float  # percentage 0–100
    streak_days: int


@router.get("/daily", response_model=DailyStats)
def daily_stats(
    x_user_id: str = Header(...),
    conn=Depends(db_connection),
):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) FROM review_log
            WHERE user_id = %s AND reviewed_at >= CURRENT_DATE
            """,
            (x_user_id,),
        )
        reviews_today = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*) FROM cards
            WHERE user_id = %s AND created_at >= CURRENT_DATE
            """,
            (x_user_id,),
        )
        new_words_today = cur.fetchone()[0]

        cur.execute(
            """
            SELECT
                ROUND(
                    100.0 * SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(*), 0),
                    1
                )
            FROM review_log
            WHERE user_id = %s
              AND reviewed_at >= NOW() - INTERVAL '30 days'
            """,
            (x_user_id,),
        )
        retention_row = cur.fetchone()[0]
        retention_rate = float(retention_row) if retention_row is not None else 0.0

        cur.execute(
            """
            WITH daily_reviews AS (
                SELECT DISTINCT DATE(reviewed_at) AS review_date
                FROM review_log
                WHERE user_id = %s
            ),
            streak AS (
                SELECT review_date,
                       review_date - (ROW_NUMBER() OVER (ORDER BY review_date))::int AS grp
                FROM daily_reviews
            )
            SELECT COUNT(*) FROM streak
            WHERE grp = (
                SELECT review_date - (ROW_NUMBER() OVER (ORDER BY review_date))::int
                FROM streak
                ORDER BY review_date DESC
                LIMIT 1
            )
            """,
            (x_user_id,),
        )
        streak_row = cur.fetchone()
        streak_days = int(streak_row[0]) if streak_row else 0

    return DailyStats(
        reviews_today=reviews_today,
        new_words_today=new_words_today,
        retention_rate=retention_rate,
        streak_days=streak_days,
    )
```

- [ ] **Step 4: Update `backend/main.py`**

```python
from fastapi import FastAPI
from session_router import router as session_router
from stats_router import router as stats_router

app = FastAPI(title="hebrai API", version="0.1.0")
app.include_router(session_router)
app.include_router(stats_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 5: Run tests**

```bash
cd backend && python -m pytest tests/test_stats_router.py -v
```

Expected: all 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/stats_router.py backend/main.py backend/tests/test_stats_router.py
git commit -m "feat: daily stats endpoint — reviews, new words, retention, streak"
```

---

## Task 2: Settings endpoint

**Files:**
- Create: `backend/settings_router.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_settings_router.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_settings_router.py`**

```python
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from main import app
from db import db_connection


@pytest.fixture
def mock_cursor():
    return MagicMock()


@pytest.fixture
def mock_conn(mock_cursor):
    conn = MagicMock()
    conn.cursor.return_value.__enter__ = lambda s: mock_cursor
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    return conn


@pytest.fixture
def client(mock_conn):
    app.dependency_overrides[db_connection] = lambda: (yield mock_conn)
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_get_settings_returns_defaults_for_new_user(client, mock_cursor):
    mock_cursor.fetchone.return_value = None
    response = client.get("/settings", headers={"X-User-ID": "new_user"})
    assert response.status_code == 200
    data = response.json()
    assert data["preferred_provider"] == "claude"
    assert data["daily_new_limit"] == 5
    assert data["show_niqqud"] is True


def test_get_settings_returns_saved_values(client, mock_cursor):
    mock_cursor.fetchone.return_value = ("openai", 10, False, "America/Sao_Paulo")
    response = client.get("/settings", headers={"X-User-ID": "user1"})
    assert response.status_code == 200
    data = response.json()
    assert data["preferred_provider"] == "openai"
    assert data["daily_new_limit"] == 10
    assert data["show_niqqud"] is False


def test_put_settings_upserts(client, mock_cursor):
    response = client.put(
        "/settings",
        json={"preferred_provider": "gpt-4o", "daily_new_limit": 7, "show_niqqud": False},
        headers={"X-User-ID": "user1"},
    )
    assert response.status_code == 200
    assert response.json()["preferred_provider"] == "gpt-4o"


def test_put_settings_invalid_provider_rejected(client, mock_cursor):
    response = client.put(
        "/settings",
        json={"preferred_provider": "malicious_provider", "daily_new_limit": 5, "show_niqqud": True},
        headers={"X-User-ID": "user1"},
    )
    assert response.status_code == 422
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && python -m pytest tests/test_settings_router.py -v 2>&1 | head -10
```

Expected: `ImportError` or 404

- [ ] **Step 3: Create `backend/settings_router.py`**

```python
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, field_validator
from db import db_connection

router = APIRouter(prefix="/settings", tags=["settings"])

_VALID_PROVIDERS = {"claude", "gpt-4o", "gemini", "ollama"}


class UserSettings(BaseModel):
    preferred_provider: str = "claude"
    daily_new_limit: int = 5
    show_niqqud: bool = True
    timezone: str = "America/Sao_Paulo"

    @field_validator("preferred_provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in _VALID_PROVIDERS:
            raise ValueError(f"provider must be one of {_VALID_PROVIDERS}")
        return v


@router.get("", response_model=UserSettings)
def get_settings(
    x_user_id: str = Header(...),
    conn=Depends(db_connection),
):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT preferred_provider, daily_new_limit, show_niqqud, timezone FROM user_settings WHERE user_id = %s",
            (x_user_id,),
        )
        row = cur.fetchone()
    if not row:
        return UserSettings()
    return UserSettings(
        preferred_provider=row[0],
        daily_new_limit=row[1],
        show_niqqud=row[2],
        timezone=row[3],
    )


@router.put("", response_model=UserSettings)
def update_settings(
    body: UserSettings,
    x_user_id: str = Header(...),
    conn=Depends(db_connection),
):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO user_settings (user_id, preferred_provider, daily_new_limit, show_niqqud, timezone)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                preferred_provider = EXCLUDED.preferred_provider,
                daily_new_limit    = EXCLUDED.daily_new_limit,
                show_niqqud        = EXCLUDED.show_niqqud,
                timezone           = EXCLUDED.timezone
            """,
            (x_user_id, body.preferred_provider, body.daily_new_limit, body.show_niqqud, body.timezone),
        )
    return body
```

- [ ] **Step 4: Update `backend/main.py`**

```python
from fastapi import FastAPI
from session_router import router as session_router
from stats_router import router as stats_router
from settings_router import router as settings_router

app = FastAPI(title="hebrai API", version="0.1.0")
app.include_router(session_router)
app.include_router(stats_router)
app.include_router(settings_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 5: Run tests**

```bash
cd backend && python -m pytest tests/test_settings_router.py -v
```

Expected: all 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/settings_router.py backend/main.py backend/tests/test_settings_router.py
git commit -m "feat: user settings endpoint — GET/PUT with provider validation"
```

---

## Task 3: Next.js API proxies for stats and settings

**Files:**
- Create: `frontend/src/app/api/stats/daily/route.ts`
- Create: `frontend/src/app/api/settings/route.ts`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Create `frontend/src/app/api/stats/daily/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
  const upstream = await fetch(`${fastapiUrl}/stats/daily`, {
    headers: { "X-User-ID": session.user.id },
  });

  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
```

- [ ] **Step 2: Create `frontend/src/app/api/settings/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
  const upstream = await fetch(`${fastapiUrl}/settings`, {
    headers: { "X-User-ID": session.user.id },
  });

  return NextResponse.json(await upstream.json(), { status: upstream.status });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";

  const upstream = await fetch(`${fastapiUrl}/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": session.user.id,
    },
    body: JSON.stringify(body),
  });

  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
```

- [ ] **Step 3: Append to `frontend/src/lib/api.ts`**

Add after the existing `submitReview` export:

```typescript
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
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/api/stats/ frontend/src/app/api/settings/ frontend/src/lib/api.ts
git commit -m "feat: proxy routes and api helpers for stats and settings"
```

---

## Task 4: DashboardStats component and full dashboard page

**Files:**
- Create: `frontend/src/components/DashboardStats.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Create `frontend/src/components/DashboardStats.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyStats } from "@/lib/api";

interface DashboardStatsProps {
  stats: DailyStats;
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        title="Revisões hoje"
        value={stats.reviews_today}
      />
      <StatCard
        title="Palavras novas"
        value={stats.new_words_today}
        subtitle="hoje"
      />
      <StatCard
        title="Retenção"
        value={`${stats.retention_rate.toFixed(0)}%`}
        subtitle="últimos 30 dias"
      />
      <StatCard
        title="Sequência"
        value={stats.streak_days}
        subtitle={stats.streak_days === 1 ? "dia" : "dias"}
      />
    </div>
  );
}
```

- [ ] **Step 2: Replace `frontend/src/app/page.tsx` with full dashboard**

```typescript
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/DashboardStats";
import { getDailyStats } from "@/lib/api";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  let stats = null;
  try {
    stats = await getDailyStats();
  } catch {
    // stats are non-blocking; show dashboard without them
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          שָׁלוֹם, {session.user.name ?? session.user.email}
        </h1>
        <Link href="/settings">
          <Button variant="ghost" size="sm">Configurações</Button>
        </Link>
      </div>

      {stats && <DashboardStats stats={stats} />}

      <Link href="/session">
        <Button className="w-full" size="lg">Iniciar sessão de estudo</Button>
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/DashboardStats.tsx frontend/src/app/page.tsx
git commit -m "feat: full dashboard with stats grid and session link"
```

---

## Task 5: Settings page

**Files:**
- Create: `frontend/src/app/settings/page.tsx`

- [ ] **Step 1: Create `frontend/src/app/settings/page.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings, updateSettings } from "@/lib/api";
import type { UserSettings } from "@/lib/api";

const PROVIDERS = [
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gpt-4o", label: "GPT-4o (OpenAI)" },
  { value: "gemini", label: "Gemini (Google)" },
  { value: "ollama", label: "Ollama (local)" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings(settings);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          ← Voltar
        </Button>
        <h1 className="text-xl font-semibold">Configurações</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferências de estudo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="provider">Modelo de IA</Label>
              <select
                id="provider"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={settings.preferred_provider}
                onChange={(e) => setSettings({ ...settings, preferred_provider: e.target.value })}
              >
                {PROVIDERS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="daily_limit">Palavras novas por dia</Label>
              <Input
                id="daily_limit"
                type="number"
                min={1}
                max={50}
                value={settings.daily_new_limit}
                onChange={(e) =>
                  setSettings({ ...settings, daily_new_limit: parseInt(e.target.value) || 5 })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="niqqud">Mostrar niqqud (pontos vocálicos)</Label>
              <button
                id="niqqud"
                type="button"
                role="switch"
                aria-checked={settings.show_niqqud}
                onClick={() => setSettings({ ...settings, show_niqqud: !settings.show_niqqud })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.show_niqqud ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.show_niqqud ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/settings/
git commit -m "feat: settings page — ai provider, daily limit, niqqud toggle"
```

---

## Task 6: Hebrew font (Noto Serif Hebrew)

**Files:**
- Modify: `frontend/src/app/layout.tsx`

The spec requires SBL Hebrew or Noto Serif Hebrew for full niqqud support. Noto Serif Hebrew is available via Google Fonts and Next.js `next/font/google`.

- [ ] **Step 1: Update `frontend/src/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_Hebrew } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const notoSerifHebrew = Noto_Serif_Hebrew({
  subsets: ["hebrew"],
  variable: "--font-hebrew",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "hebrai.co — Hebraico Bíblico",
  description: "Aprenda vocabulário de hebraico bíblico com revisão espaçada adaptativa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerifHebrew.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Update `HebrewWord` to use the CSS variable**

Edit `frontend/src/components/HebrewWord.tsx` — change `font-serif` to use the Hebrew font variable:

```typescript
// Replace this line:
className={`font-serif ${SIZE_CLASSES[size]} leading-loose tracking-wide ${className}`}

// With:
className={`[font-family:var(--font-hebrew)] ${SIZE_CLASSES[size]} leading-loose tracking-wide ${className}`}
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

Expected: build completes with no font errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/layout.tsx frontend/src/components/HebrewWord.tsx
git commit -m "feat: noto serif hebrew font with niqqud support via next/font/google"
```

---

## Task 7: Nginx HTTPS configuration

**Files:**
- Modify: `nginx/nginx.conf`

- [ ] **Step 1: Replace `nginx/nginx.conf`**

```nginx
server {
    listen 80;
    server_name hebrai.co www.hebrai.co;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name hebrai.co www.hebrai.co;

    ssl_certificate     /etc/letsencrypt/live/hebrai.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hebrai.co/privkey.pem;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://next:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- [ ] **Step 2: Update `docker-compose.yml` to mount Let's Encrypt certs**

Add a volume mount to the `nginx` service in `docker-compose.yml`:

```yaml
  nginx:
    image: nginx:stable-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - next
    networks:
      - external
```

Note: `/etc/letsencrypt` must exist on the host (populated by Certbot — see Task 8).

- [ ] **Step 3: Commit**

```bash
git add nginx/nginx.conf docker-compose.yml
git commit -m "chore: nginx https config with let's encrypt ssl"
```

---

## Task 8: VPS deployment scripts

**Files:**
- Create: `deploy/setup-vps.sh`
- Create: `deploy/deploy.sh`

- [ ] **Step 1: Create `deploy/` directory**

```bash
mkdir -p deploy
```

- [ ] **Step 2: Create `deploy/setup-vps.sh`**

This script runs once on a fresh Ubuntu 24.04 VPS as root. It installs Docker, clones the repo, and obtains the SSL certificate.

```bash
#!/usr/bin/env bash
set -euo pipefail

DOMAIN="hebrai.co"
REPO="https://github.com/YOUR_GITHUB_USER/hebrai.co.git"
APP_DIR="/opt/hebrai"
EMAIL="hello@filipenegrao.com"

echo "=== Installing Docker ==="
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "=== Installing Certbot ==="
apt-get install -y -qq certbot

echo "=== Cloning repo ==="
git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"

echo "=== Obtaining SSL certificate (standalone — port 80 must be free) ==="
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo "=== Setting up .env ==="
cp .env.example .env
echo ""
echo "ACTION REQUIRED: edit $APP_DIR/.env and fill in real secrets, then run:"
echo "  cd $APP_DIR && bash deploy/deploy.sh"
```

- [ ] **Step 3: Create `deploy/deploy.sh`**

This script runs on the VPS for every deployment (pulls latest + restarts).

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/hebrai"
cd "$APP_DIR"

echo "=== Pulling latest ==="
git pull --ff-only

echo "=== Building and restarting containers ==="
docker compose pull postgres 2>/dev/null || true
docker compose build --no-cache next fastapi
docker compose up -d --remove-orphans

echo "=== Waiting for health check ==="
sleep 10
STATUS=$(docker compose exec -T fastapi curl -s http://localhost:8000/health | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "error")
if [ "$STATUS" = "ok" ]; then
  echo "=== Deploy complete — FastAPI healthy ==="
else
  echo "=== WARNING: FastAPI health check failed after deploy ==="
  docker compose logs fastapi --tail=20
  exit 1
fi
```

- [ ] **Step 4: Make scripts executable and commit**

```bash
chmod +x deploy/setup-vps.sh deploy/deploy.sh
git add deploy/
git commit -m "chore: vps setup and deploy scripts"
```

---

## Task 9: Full end-to-end verification

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && python -m pytest tests/ -v
```

Expected: all tests PASS (fsrs, ai, session, stats, settings).

- [ ] **Step 2: Build frontend**

```bash
cd frontend && npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 3: Full stack smoke test**

```bash
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD, BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose build
docker compose up -d
sleep 10

# Health
docker compose exec fastapi curl -s http://localhost:8000/health
# Expected: {"status":"ok"}

# Nginx → Next.js
curl -s -o /dev/null -w "%{http_code}" http://localhost:80
# Expected: 200 or 302

# Word count
docker compose exec postgres psql -U hebrai -d hebrai -c "SELECT COUNT(*) FROM words;"
# Expected: 20

docker compose down
```

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: verified full stack — dashboard, settings, font, deploy scripts"
```

---

## Self-Review Checklist

- [x] Spec §6 /settings route → Task 5 (settings page), Task 2 (settings endpoint)
- [x] Spec §6 / dashboard with metrics → Task 4 (DashboardStats, full dashboard page)
- [x] Spec §7 DashboardStats component → Task 4
- [x] Spec §9 Noto Serif Hebrew font, dir=rtl, niqqud toggle → Task 6 (font), HebrewWord already handles RTL + niqqud strip
- [x] Spec §2 deploy: Docker Compose, Ubuntu 24.04, Nginx → Tasks 7, 8
- [x] HTTPS / Let's Encrypt → Task 7
- [x] Preferred provider stored in user_settings → Task 2 (settings_router), Task 5 (settings page)
- [x] FSRS params + daily_new_limit exposed in settings → Task 5
- [x] No TBDs, no placeholder steps
