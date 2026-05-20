import Link from "next/link";
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
      <p className="text-muted-foreground mb-6">Dashboard — em construção</p>
      <Link
        href="/session"
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Iniciar sessão
      </Link>
    </main>
  );
}
