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
