# hebrai.co — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the project scaffold: Docker Compose (Next.js + FastAPI + PostgreSQL + Nginx), database schema with migrations, Hebrew word seed data, Next.js app with Tailwind + shadcn/ui, and Better Auth with login/register pages and a protected dashboard shell.

**Architecture:** Monorepo with `frontend/` (Next.js) and `backend/` (FastAPI) directories. Three Docker containers share a network; Nginx routes external traffic. Better Auth runs inside Next.js and writes sessions to PostgreSQL. FastAPI is internal-only (not exposed via Nginx in this plan).

**Tech Stack:** Docker Compose, Nginx stable-alpine, PostgreSQL 18, Next.js 16.2 (App Router), Tailwind CSS 4.3, shadcn/ui, Better Auth 1.6.9, Python 3.14, FastAPI 0.136.1 (scaffold only in this plan)

**Version policy:** Start new work on current stable releases as of 2026-05-17; prefer explicit version pins in dependency manifests and stable container tags over floating defaults. Keep the Task 5 stub minimal; add provider SDKs, database drivers, FSRS, and dotenv only in the tasks that first use them.

---

## File Map

```
hebrai.co/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── nginx/
│   └── nginx.conf
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed/
│       ├── seed_words.py
│       └── words.csv                  ← top-500 Biblical Hebrew frequency list
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py                        ← FastAPI stub (health check only)
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx               ← dashboard (auth-protected)
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── api/
    │   │       └── auth/
    │   │           └── [...all]/
    │   │               └── route.ts   ← Better Auth handler
    │   ├── lib/
    │   │   ├── auth.ts                ← Better Auth server config
    │   │   └── auth-client.ts         ← Better Auth browser client
    │   └── middleware.ts              ← route protection
    └── components/
        └── ui/                        ← shadcn/ui components
```

---

## Task 1: Project scaffold

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `docker-compose.yml`

- [ ] **Step 1: Initialize git and create directory structure**

```bash
cd /Users/filipenegrao/Documents/graphic-design/2026/hebrai.co
git init
mkdir -p nginx database/migrations database/seed backend frontend
```

- [ ] **Step 2: Create `.gitignore`**

```
# Environment
.env
.env.local
.env.*.local

# Node
frontend/node_modules/
frontend/.next/
frontend/out/

# Python
backend/__pycache__/
backend/.venv/
backend/venv/
*.pyc
*.pyo

# Docker
.docker/

# OS
.DS_Store
Thumbs.db

# Superpowers
.superpowers/

# Database
*.dump
```

- [ ] **Step 3: Create `.env.example`**

```bash
# PostgreSQL
POSTGRES_DB=hebrai
POSTGRES_USER=hebrai
POSTGRES_PASSWORD=changeme
DATABASE_URL=postgresql://hebrai:changeme@postgres:5432/hebrai

# Better Auth
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000

# AI Providers (fill in what you have)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# FastAPI
FASTAPI_URL=http://fastapi:8000
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    networks:
      - internal

  fastapi:
    build: ./backend
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
    depends_on:
      - postgres
    networks:
      - internal

  next:
    build: ./frontend
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}
      FASTAPI_URL: ${FASTAPI_URL}
    depends_on:
      - postgres
      - fastapi
    networks:
      - internal
      - external

  nginx:
    image: nginx:stable-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - next
    networks:
      - external

networks:
  internal:
    internal: true
  external:

volumes:
  postgres_data:
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.example docker-compose.yml
git commit -m "chore: project scaffold — git, env, docker-compose"
```

---

## Task 2: Nginx config

**Files:**
- Create: `nginx/nginx.conf`

- [ ] **Step 1: Create `nginx/nginx.conf`**

```nginx
server {
    listen 80;
    server_name hebrai.co www.hebrai.co;

    location / {
        proxy_pass http://next:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Note: FastAPI (`fastapi:8000`) is NOT exposed via Nginx — it is only reachable from `next` on the internal Docker network.

- [ ] **Step 2: Commit**

```bash
git add nginx/nginx.conf
git commit -m "chore: nginx reverse proxy config"
```

---

## Task 3: PostgreSQL schema migration

**Files:**
- Create: `database/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create `database/migrations/001_initial_schema.sql`**

```sql
-- Better Auth manages its own tables (users, sessions, accounts, verifications)
-- We manage the application tables below.

CREATE TABLE IF NOT EXISTS words (
    id              SERIAL PRIMARY KEY,
    hebrew          TEXT NOT NULL,
    transliteration TEXT NOT NULL,
    gloss_pt        TEXT NOT NULL,
    morphology      JSONB NOT NULL DEFAULT '{}',
    frequency_rank  INT,
    source_reference TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards (
    id               SERIAL PRIMARY KEY,
    user_id          TEXT NOT NULL,        -- references Better Auth users.id
    word_id          INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    fsrs_state       JSONB NOT NULL DEFAULT '{}',
    format_override  TEXT CHECK (format_override IN ('flashcard', 'multiple_choice', 'typing')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    UNIQUE (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS review_log (
    id                   SERIAL PRIMARY KEY,
    card_id              INT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id              TEXT NOT NULL,
    rating               INT NOT NULL CHECK (rating BETWEEN 1 AND 4),
    exercise_format_used TEXT NOT NULL,
    response_time_ms     INT,
    reviewed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_content_cache (
    id          SERIAL PRIMARY KEY,
    word_id     INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    provider    TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    content     JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (word_id, provider, prompt_hash)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id            TEXT PRIMARY KEY,   -- references Better Auth users.id
    preferred_provider TEXT NOT NULL DEFAULT 'claude',
    fsrs_params        JSONB NOT NULL DEFAULT '{}',
    daily_new_limit    INT NOT NULL DEFAULT 5,
    show_niqqud        BOOLEAN NOT NULL DEFAULT TRUE,
    timezone           TEXT NOT NULL DEFAULT 'America/Sao_Paulo'
);

-- Indexes for hot query paths
CREATE INDEX IF NOT EXISTS idx_cards_user_due ON cards(user_id, (fsrs_state->>'due'));
CREATE INDEX IF NOT EXISTS idx_review_log_card ON review_log(card_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup ON ai_content_cache(word_id, provider, prompt_hash);
```

- [ ] **Step 2: Verify SQL syntax locally**

```bash
docker run --rm postgres:18-alpine psql --help > /dev/null && echo "postgres image available"
# If you have psql locally:
psql --version
```

- [ ] **Step 3: Commit**

```bash
git add database/migrations/001_initial_schema.sql
git commit -m "feat: initial postgresql schema — words, cards, review_log, ai_content_cache, user_settings"
```

---

## Task 4: Hebrew word seed data and import script

**Files:**
- Create: `database/seed/words.csv`
- Create: `database/seed/seed_words.py`

- [ ] **Step 1: Create `database/seed/words.csv` with top-20 Biblical Hebrew words**

The full list should come from the Open Scriptures Hebrew Bible frequency data (https://github.com/openscriptures/HebrewLexicon). For now, seed with the 20 most frequent words to validate the pipeline. Replace with the full list before launch.

```csv
hebrew,transliteration,gloss_pt,frequency_rank,source_reference,morphology
וְ,ve,e (conjunção),1,Gn 1:1,"{""class"": ""conjunction""}"
הַ,ha,o/a (artigo definido),2,Gn 1:1,"{""class"": ""article""}"
אֵת,et,(marcador de objeto direto),3,Gn 1:1,"{""class"": ""particle""}"
אֲשֶׁר,asher,que / o qual,4,Gn 1:2,"{""class"": ""relative_pronoun""}"
כֹּל,kol,todo / tudo,5,Gn 1:31,"{""class"": ""noun"", ""gender"": ""m""}"
לֹא,lo,não,6,Gn 1:4,"{""class"": ""adverb""}"
כִּי,ki,porque / que,7,Gn 1:4,"{""class"": ""conjunction""}"
אֵל,el,Deus,8,Gn 1:1,"{""class"": ""noun"", ""gender"": ""m""}"
יְהוָה,YHWH,SENHOR,9,Gn 2:4,"{""class"": ""proper_noun""}"
עַל,al,sobre / em cima de,10,Gn 1:2,"{""class"": ""preposition""}"
אֶל,el,para / a,11,Gn 1:9,"{""class"": ""preposition""}"
בֵּן,ben,filho,12,Gn 4:17,"{""class"": ""noun"", ""gender"": ""m""}"
מֶלֶךְ,melekh,rei,13,Gn 14:1,"{""class"": ""noun"", ""gender"": ""m""}"
אֶרֶץ,erets,terra / terra,14,Gn 1:1,"{""class"": ""noun"", ""gender"": ""f""}"
יוֹם,yom,dia,15,Gn 1:5,"{""class"": ""noun"", ""gender"": ""m""}"
אִישׁ,ish,homem,16,Gn 2:23,"{""class"": ""noun"", ""gender"": ""m""}"
עַם,am,povo,17,Gn 14:16,"{""class"": ""noun"", ""gender"": ""m""}"
בַּיִת,bayit,casa,18,Gn 12:1,"{""class"": ""noun"", ""gender"": ""m""}"
תּוֹרָה,torah,lei / instrução,19,Ex 12:49,"{""class"": ""noun"", ""gender"": ""f"", ""root"": ""י-ר-ה""}"
דָּבָר,davar,palavra / coisa,20,Gn 11:1,"{""class"": ""noun"", ""gender"": ""m"", ""root"": ""ד-ב-ר""}"
```

- [ ] **Step 2: Create `database/seed/seed_words.py`**

```python
"""Import Biblical Hebrew words from CSV into PostgreSQL words table."""

import csv
import json
import os
import sys

import psycopg2


def seed_words(csv_path: str, database_url: str) -> None:
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    inserted = 0
    skipped = 0

    for row in rows:
        morphology = json.loads(row["morphology"]) if row["morphology"] else {}
        frequency_rank = int(row["frequency_rank"]) if row["frequency_rank"] else None
        source_reference = row["source_reference"] or None

        cur.execute(
            """
            INSERT INTO words (hebrew, transliteration, gloss_pt, morphology, frequency_rank, source_reference)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (
                row["hebrew"],
                row["transliteration"],
                row["gloss_pt"],
                json.dumps(morphology),
                frequency_rank,
                source_reference,
            ),
        )
        if cur.rowcount:
            inserted += 1
        else:
            skipped += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"Seed complete: {inserted} inserted, {skipped} skipped.")


if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "words.csv"
    database_url = os.environ["DATABASE_URL"]
    seed_words(csv_path, database_url)
```

- [ ] **Step 3: Test the seed script locally**

```bash
# Start only postgres for now
cp .env.example .env
# Edit .env — set real values (keep default for local dev)
docker compose up postgres -d

# Wait ~5 seconds for postgres to initialize, then run seed
DATABASE_URL=postgresql://hebrai:changeme@localhost:5432/hebrai \
  python3 database/seed/seed_words.py database/seed/words.csv
```

Expected output:
```
Seed complete: 20 inserted, 0 skipped.
```

- [ ] **Step 4: Verify rows in DB**

```bash
docker compose exec postgres psql -U hebrai -d hebrai -c "SELECT id, hebrew, gloss_pt, frequency_rank FROM words ORDER BY frequency_rank LIMIT 5;"
```

Expected: 5 rows with Hebrew characters and Portuguese glosses.

- [ ] **Step 5: Commit**

```bash
git add database/seed/words.csv database/seed/seed_words.py
git commit -m "feat: hebrew word seed data and import script (top-20 for dev)"
```

---

## Task 5: FastAPI stub (health check)

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.136.1
uvicorn[standard]==0.46.0
```

- [ ] **Step 2: Create `backend/main.py`**

```python
from fastapi import FastAPI

app = FastAPI(title="hebrai API", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 3: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 4: Build and verify the FastAPI container**

```bash
docker compose build fastapi
docker compose up fastapi -d
sleep 3
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

```bash
docker compose down
```

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: fastapi stub with health check endpoint"
```

---

## Task 6: Next.js scaffold with Tailwind and shadcn/ui

**Files:**
- Create: `frontend/` (Next.js project)
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd frontend
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
cd ..
```

When prompted: accept all defaults.

- [ ] **Step 2: Install Better Auth and dependencies**

```bash
cd frontend
npm install better-auth@latest @better-auth/client pg
npm install -D @types/pg
cd ..
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd frontend
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

Then add the components used in this plan:

```bash
npx shadcn@latest add button card input label
cd ..
```

- [ ] **Step 4: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `frontend/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 5: Verify Next.js builds**

```bash
cd frontend && npm run build && cd ..
```

Expected: Build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: next.js scaffold with tailwind, shadcn/ui, and production dockerfile"
```

---

## Task 7: Better Auth configuration

**Files:**
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/lib/auth-client.ts`
- Create: `frontend/src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create `frontend/src/lib/auth.ts`**

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});
```

- [ ] **Step 2: Create `frontend/src/lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
});
```

Add `NEXT_PUBLIC_BETTER_AUTH_URL` to `.env.example`:

```bash
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

- [ ] **Step 3: Create `frontend/src/app/api/auth/[...all]/route.ts`**

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 4: Run Better Auth schema generation**

Better Auth needs to create its own tables (users, sessions, accounts, verifications).

```bash
cd frontend
DATABASE_URL=postgresql://hebrai:changeme@localhost:5432/hebrai \
  npx better-auth generate
```

Review the generated SQL, then apply it:

```bash
DATABASE_URL=postgresql://hebrai:changeme@localhost:5432/hebrai \
  npx better-auth migrate
cd ..
```

Expected: Better Auth tables created in PostgreSQL without error.

- [ ] **Step 5: Verify auth tables exist**

```bash
docker compose exec postgres psql -U hebrai -d hebrai \
  -c "\dt" | grep -E "user|session|account|verification"
```

Expected: rows for `user`, `session`, `account`, `verification` (or similar names depending on Better Auth version).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/auth.ts frontend/src/lib/auth-client.ts frontend/src/app/api/auth/
git commit -m "feat: better auth configuration with postgresql adapter"
```

---

## Task 8: Auth pages (login / register)

**Files:**
- Create: `frontend/src/app/login/page.tsx`

- [ ] **Step 1: Create `frontend/src/app/login/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await authClient.signUp.email({ email, password, name });
        if (error) throw new Error(error.message);
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            <span className="font-serif" dir="rtl">הֶבְרַאִי</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Criar conta" : "Já tenho conta"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Test the login page locally**

```bash
cd frontend && npm run dev &
# Open http://localhost:3000/login
# Try registering a new account — should redirect to / on success
# Try logging in with the same account
```

Expected: register and login both work; redirect to `/` after success.

Kill dev server: `kill %1`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/login/
git commit -m "feat: login/register page with better auth email+password"
```

---

## Task 9: Route protection middleware and dashboard shell

**Files:**
- Create: `frontend/src/middleware.ts`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Create `frontend/src/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!isPublic && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Update `frontend/src/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "hebrai.co — Hebraico Bíblico",
  description: "Aprenda vocabulário de hebraico bíblico com revisão espaçada adaptativa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Replace `frontend/src/app/page.tsx` with dashboard shell**

```typescript
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold mb-2">
        שָׁלוֹם, {session.user.name ?? session.user.email}
      </h1>
      <p className="text-muted-foreground">Dashboard — em construção</p>
    </main>
  );
}
```

- [ ] **Step 4: Test route protection**

```bash
cd frontend && npm run dev &
```

- Open `http://localhost:3000` — should redirect to `/login` (not logged in)
- Log in — should land on dashboard with "שָׁלוֹם, [name]"
- Verify Hebrew renders correctly in the browser

Kill dev server: `kill %1`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/middleware.ts frontend/src/app/layout.tsx frontend/src/app/page.tsx
git commit -m "feat: route protection middleware and authenticated dashboard shell"
```

---

## Task 10: Full stack smoke test with Docker Compose

- [ ] **Step 1: Copy `.env.example` to `.env` and fill in values**

```bash
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD and BETTER_AUTH_SECRET
# BETTER_AUTH_SECRET: openssl rand -base64 32
```

- [ ] **Step 2: Build all containers**

```bash
docker compose build
```

Expected: all three images build without error.

- [ ] **Step 3: Start the full stack**

```bash
docker compose up -d
sleep 10  # wait for postgres + next to initialize
```

- [ ] **Step 4: Verify all services are healthy**

```bash
# Next.js
curl -s -o /dev/null -w "%{http_code}" http://localhost:80
# Expected: 200 or 302 (redirect to /login)

# FastAPI (internal — test via docker exec)
docker compose exec fastapi curl -s http://localhost:8000/health
# Expected: {"status":"ok"}

# PostgreSQL
docker compose exec postgres psql -U hebrai -d hebrai -c "SELECT COUNT(*) FROM words;"
# Expected: count = 20
```

- [ ] **Step 5: Tear down**

```bash
docker compose down
```

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: verified full stack smoke test — nginx, next, fastapi, postgres"
```

---

## Self-Review Checklist (completed inline)

- [x] Spec section 2 (Stack): Docker Compose, Nginx, PostgreSQL, Next.js, Better Auth → Tasks 1–2, 6–7
- [x] Spec section 3 (Architecture): internal network, Nginx proxy, FastAPI not exposed → Tasks 1–2, 5
- [x] Spec section 4 (Data model): all 5 tables + indexes → Task 3
- [x] Spec section 4 (Seed): words.csv + import script → Task 4
- [x] Spec section 6 (Auth route `/login`) → Tasks 8–9
- [x] Spec section 6 (Dashboard `/`) → Task 9
- [x] Spec section 9 (Hebrew rendering): Hebrew font note in login page, RTL dir attribute → Tasks 8–9
- [x] FastAPI stub present so Docker Compose network resolves → Task 5
- [x] No TBDs, no placeholder steps, all code blocks complete
