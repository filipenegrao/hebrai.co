import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/DashboardStats";
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

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          שָׁלוֹם, {session.user.name ?? session.user.email}
        </h1>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Configurações
        </Link>
      </div>

      {stats && <DashboardStats stats={stats} />}

      <Link
        href="/session"
        className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Iniciar sessão de estudo
      </Link>
    </main>
  );
}
