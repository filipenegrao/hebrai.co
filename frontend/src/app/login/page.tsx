"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LumenEyebrow, LumenPageTitle, LumenShell } from "@/components/LumenChrome";

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
        if (error) throw new Error(error.message ?? "Erro desconhecido");
      } else {
        const { error } = await authClient.signUp.email({ email, password, name });
        if (error) throw new Error(error.message ?? "Erro desconhecido");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LumenShell>
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-6 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="space-y-6">
          <LumenEyebrow>Leia a Escritura no idioma original</LumenEyebrow>
          <LumenPageTitle
            title="Entre para retomar o vocabulário bíblico."
            subtitle="Sessões breves, repetição espaçada e comentários gerados por IA para tornar cada palavra memorável."
          />

          <div className="space-y-4">
            <div
              dir="rtl"
              lang="he"
              className="text-7xl leading-none text-[var(--lumen-bone)] [font-family:var(--font-hebrew)] drop-shadow-[0_0_36px_rgba(229,184,95,0.25)] sm:text-8xl"
            >
              הֶבְרַאִי
            </div>
            <p className="max-w-md text-base italic text-[var(--lumen-bone-soft)]">
              Dez palavras por dia. Retenção alta. Uma rotina silenciosa para
              quem quer reconhecer o texto hebraico com familiaridade real.
            </p>
          </div>
        </section>

        <Card className="w-full max-w-xl justify-self-end">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <LumenEyebrow className="text-[var(--lumen-bone-muted)]">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </LumenEyebrow>
              <h2 className="text-3xl font-light italic text-[var(--lumen-bone)]">
                {mode === "login" ? "Volte ao seu ritmo." : "Comece sua jornada."}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading} size="lg">
                {loading ? "A processar…" : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
              <button
                type="button"
                className="w-full text-sm italic text-[var(--lumen-bone-soft)] transition-colors hover:text-[var(--lumen-bone)]"
                onClick={() => {
                  setError("");
                  setMode(mode === "login" ? "register" : "login");
                }}
              >
                {mode === "login" ? "Criar conta" : "Já tenho conta"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </LumenShell>
  );
}
