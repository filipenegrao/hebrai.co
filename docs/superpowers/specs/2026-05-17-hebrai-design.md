# hebrai.co — Design Spec

**Data:** 2026-05-17
**Domínio:** hebrai.co
**Objetivo:** Aplicativo web de aprendizado de hebraico bíblico, começando com vocabulário e expandindo para gramática e leitura de textos.

---

## 1. Visão Geral

App de vocabulário de hebraico bíblico com exercícios adaptativos baseados em revisão espaçada (FSRS) e geração de conteúdo por IA. O caminho de aprendizado é curado dinamicamente pela IA com base no progresso do usuário. Começa voltado para iniciantes absolutos, com arquitetura pensada para crescer em complexidade de conteúdo conforme o usuário avança.

**Usuário inicial:** iniciante absoluto (sem contato prévio com hebraico)
**Usuário futuro:** estudantes de teologia, leitores bíblicos autodidatas, avançados

---

## 2. Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Auth | Better Auth |
| Backend / Motor de IA | Python FastAPI + uvicorn |
| SRS | `py-fsrs` (FSRS v5) |
| Orquestração de IA | LiteLLM (multi-provider) |
| Banco de dados | PostgreSQL (self-hosted) |
| Deploy | Docker Compose — VPS Ubuntu 24.04 |
| Reverse proxy | Nginx |

### Providers de IA suportados (via LiteLLM)
- Claude (Anthropic) — padrão
- GPT-4o (OpenAI)
- Gemini (Google)
- Modelos locais via Ollama

Next.js e FastAPI se comunicam via rede interna Docker. Nenhum dos dois fica exposto diretamente — tráfego externo passa pelo Nginx.

---

## 3. Arquitetura de Deploy

```
[Browser]
    |  HTTPS
[Nginx] ← reverse proxy
    ├── / → [Next.js container]  ← App Router, Better Auth, shadcn/ui
    └── /api/internal → [FastAPI container]  ← FSRS, IA, geração de conteúdo
              |
         [PostgreSQL container]
```

Docker Compose com três serviços: `next`, `fastapi`, `postgres`. FastAPI não é acessível externamente — Next.js proxeia as chamadas via API routes.

---

## 4. Modelo de Dados

```sql
-- Gerenciado pelo Better Auth
users (id, email, created_at, ...)

-- Vocabulário hebraico
words (
  id, hebrew, transliteration, gloss_pt,
  morphology JSONB,        -- raiz, classe, padrão nominal, binyan
  frequency_rank INT,      -- posição por frequência no Tanakh
  source_reference TEXT,   -- ex: "Gn 1:1"
  created_at
)

-- Instância SRS por usuário (um card por palavra por usuário)
cards (
  id, user_id → users, word_id → words,
  fsrs_state JSONB,        -- stability, difficulty, due_date, reps, lapses
  format_override TEXT,    -- null = IA decide | "flashcard" | "multiple_choice" | "typing"
  created_at, last_reviewed_at
)

-- Histórico imutável de revisões
review_log (
  id, card_id → cards, user_id → users,
  rating INT,              -- 1=again, 2=hard, 3=good, 4=easy (escala FSRS)
  exercise_format_used TEXT,
  response_time_ms INT,
  reviewed_at
)

-- Cache de conteúdo gerado pela IA
ai_content_cache (
  id, word_id → words,
  provider TEXT, prompt_hash TEXT,
  content JSONB,           -- exemplo bíblico, explicação, distractors para MC
  created_at
)

-- Preferências por usuário
user_settings (
  user_id → users,
  preferred_provider TEXT,
  fsrs_params JSONB,       -- parâmetros otimizáveis pelo usuário
  daily_new_limit INT,     -- padrão: 5
  show_niqqud BOOL,        -- padrão: true
  timezone TEXT
)
```

**Invariantes importantes:**
- `fsrs_state` é sobrescrito a cada revisão; `review_log` é append-only
- `ai_content_cache` usa `prompt_hash` para evitar chamadas duplicadas ao provider
- `morphology` em `words` é JSONB livre — não engessar schema para casos futuros (binyanim, paradigmas verbais)

**Seed da tabela `words`:** populada a partir de dataset estático de hebraico bíblico (ex: Open Scriptures Hebrew Bible ou lista de frequência do BDB Lexicon), contendo hebrew, transliteração, gloss PT e frequency_rank. A IA não cria palavras — ela gera o *conteúdo pedagógico* (exemplos, explicações, distractors) referenciado em `ai_content_cache`. O dataset seed é importado via script Python antes do primeiro deploy.

---

## 5. Fluxo de Sessão de Estudo

```
1. GET /session/next-cards  (FastAPI)
   ├── Busca cards com due_date ≤ hoje (revisões pendentes)
   ├── Adiciona até N cards novos (limite em user_settings.daily_new_limit)
   └── Ordena por prioridade FSRS

2. Para cada card, FastAPI determina formato do exercício:
   ├── reps == 0           → multiple_choice (introdução)
   ├── 1 ≤ reps ≤ 3       → flashcard
   ├── reps > 3            → flashcard ou typing
   └── IA pode sobrescrever com base em padrão de erros recentes

3. FastAPI verifica ai_content_cache (word_id + formato + provider)
   ├── HIT  → retorna conteúdo cacheado
   └── MISS → chama LiteLLM → salva cache → retorna conteúdo

4. Next.js renderiza exercício (RTL, niqqud, fonte hebraica)

5. Usuário responde → POST /session/review
   { card_id, rating, format_used, response_time_ms }

6. FastAPI:
   ├── Atualiza cards.fsrs_state via py-fsrs
   ├── Insere linha em review_log
   └── Retorna próximo card (ou fim de sessão)
```

### Curadoria de trilha pela IA

Processo separado do fluxo de sessão. Roda ao fim de cada sessão (ou periodicamente via cron). FastAPI analisa `review_log` recente e usa o LLM para selecionar as próximas palavras a introduzir, considerando:
- Padrão de erros (pontos fracos do usuário)
- Raízes em comum com palavras já dominadas
- Frequência no Tanakh
- Coerência temática

---

## 6. Estrutura de Telas (MVP)

| Rota | Tela | Função |
|------|------|--------|
| `/` | Dashboard | Métricas do dia, botão de iniciar sessão, previsão de revisões |
| `/session` | Exercício | Fluxo de cards adaptativo (MC → flashcard → typing) |
| `/settings` | Configurações | Provider de IA, limite diário, FSRS params, toggle niqqud |
| `/login` | Auth | Login / cadastro via Better Auth |

**Telas futuras (pós-MVP):** `/progress` (histórico e curva de retenção), `/browse` (navegar vocabulário), `/grammar` (exercícios de gramática)

---

## 7. Componentes de UI Relevantes

- **HebrewWord** — renderiza texto hebraico com fonte adequada, suporte RTL, toggle de niqqud
- **ExerciseCard** — wrapper adaptativo que renderiza MC, flashcard ou typing conforme o formato
- **RatingBar** — botões de avaliação FSRS (errei / difícil / bom / fácil)
- **SessionProgress** — barra de progresso da sessão atual
- **DashboardStats** — métricas diárias (revisões, novas palavras, retenção)

---

## 8. Abstração de IA (FastAPI)

```python
# Interface unificada via LiteLLM
class AIProvider:
    def complete(self, prompt: str, model: str | None = None) -> str: ...

# Prompts tipados por função
class ContentGenerator:
    def generate_card_content(self, word: Word, format: ExerciseFormat) -> CardContent: ...
    def generate_distractors(self, word: Word, n: int = 3) -> list[str]: ...
    def curate_next_words(self, user_id: str, review_log: list[Review]) -> list[int]: ...
```

Provider configurável por usuário em `user_settings.preferred_provider`. Troca de provider não requer mudança de código — apenas a string do modelo no LiteLLM.

---

## 9. Considerações de Renderização de Hebraico

- Fonte: **SBL Hebrew** ou **Noto Serif Hebrew** (Google Fonts) — suporte completo a niqqud e cantilação
- Direção: `dir="rtl"` no elemento raiz de cada palavra; mistura bidirecional (gloss em PT ao lado) via `unicode-bidi`
- Niqqud opcional: toggle em `user_settings.show_niqqud` — palavra renderizada com ou sem pontos vocálicos
- Tamanho: palavras hebraicas precisam de font-size maior que o texto latino circundante (~1.3–1.5x) para legibilidade de niqqud

---

## 10. Fora de Escopo (MVP)

- Áudio / pronúncia
- Exercícios de gramática (paradigmas verbais, declinações)
- Leitura de passagens bíblicas completas
- App mobile nativo
- Modo offline / PWA
- Compartilhamento social / gamificação
- Admin panel para gestão de conteúdo
