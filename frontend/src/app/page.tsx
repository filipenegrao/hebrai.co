import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/DashboardStats";
import {
  LumenEyebrow,
  LumenHeader,
  LumenPageTitle,
  LumenPanel,
  LumenShell,
} from "@/components/LumenChrome";
import type { DailyStats } from "@/lib/api";

async function fetchStats(userId: string): Promise<DailyStats | null> {
  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
  try {
    const upstream = await fetch(`${fastapiUrl}/stats/daily`, {
      cache: "no-store",
      headers: { "X-User-ID": userId },
    });
    if (!upstream.ok) return null;
    return (await upstream.json()) as DailyStats;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const stats = await fetchStats(session.user.id);
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <LumenShell>
      <LumenHeader
        current="Painel"
        rightSlot={
          <div className="hidden text-right md:block">
            <div className="lumen-sc text-[10px] text-[var(--lumen-bone-muted)]">
              Hoje
            </div>
            <div className="text-sm italic text-[var(--lumen-bone-soft)] capitalize">
              {today}
            </div>
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-10 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        <section className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-5">
            <LumenEyebrow>Boa noite</LumenEyebrow>
            <LumenPageTitle
              title={`Olá, ${session.user.name ?? session.user.email}.`}
              subtitle={
                <>
                  <span
                    dir="rtl"
                    lang="he"
                    className="mr-3 inline-block align-middle text-6xl text-[var(--lumen-bone)] [font-family:var(--font-hebrew)] drop-shadow-[0_0_28px_rgba(229,184,95,0.28)] sm:text-7xl"
                  >
                    שָׁלוֹם
                  </span>
                  Dez palavras aguardam revisão hoje. Preserve sua sequência com
                  uma sessão curta e concentrada.
                </>
              }
            />

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/session" className="inline-flex">
                <span className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--lumen-gold)] bg-[rgba(229,184,95,0.12)] px-6 text-base italic text-[var(--lumen-bone)] shadow-[inset_0_0_24px_rgba(229,184,95,0.18),0_0_24px_rgba(229,184,95,0.08)] transition-colors hover:bg-[rgba(229,184,95,0.18)]">
                  Iniciar sessão de estudo
                </span>
              </Link>
              <span className="lumen-kbd">≈ 12 min</span>
            </div>
          </div>

          <LumenPanel className="justify-between gap-6">
            <div className="space-y-2">
              <LumenEyebrow className="text-[var(--lumen-bone-muted)]">
                Programa do dia
              </LumenEyebrow>
              <h2 className="text-3xl font-light italic text-[var(--lumen-bone)]">
                Leitura, repetição, retenção.
              </h2>
            </div>
            <div className="space-y-4">
              {[
                ["Revisão", `${stats?.reviews_today ?? 10} cartas devidas`],
                ["Novas", `${stats?.new_words_today ?? 10} palavras centrais`],
                ["Comentador", "Claude Sonnet ativo"],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="grid grid-cols-[68px_1fr] gap-4 border-b border-[var(--lumen-hairline-soft)] pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="lumen-sc text-[10px] text-[var(--lumen-bone-muted)]">
                    {title}
                  </span>
                  <span className="text-base italic text-[var(--lumen-bone-soft)]">
                    {body}
                  </span>
                </div>
              ))}
            </div>
          </LumenPanel>
        </section>

        {stats ? <DashboardStats stats={stats} /> : null}
      </div>
    </LumenShell>
  );
}
