"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LumenEyebrow, LumenShell } from "@/components/LumenChrome";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const hasError = searchParams.get("error") === "INVALID_TOKEN";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (hasError || !token) {
    return (
      <div className="space-y-4">
        <LumenEyebrow className="text-[var(--lumen-bone-muted)]">Link inválido</LumenEyebrow>
        <h2 className="text-3xl font-light italic text-[var(--lumen-bone)]">
          Este link expirou.
        </h2>
        <p className="text-sm text-[var(--lumen-bone-soft)]">
          O link de redefinição é inválido ou já expirou. Solicite um novo link na página de login.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Voltar ao login
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
      if (error) throw new Error(error.message ?? "Erro desconhecido");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LumenEyebrow className="text-[var(--lumen-bone-muted)]">Nova senha</LumenEyebrow>
        <h2 className="text-3xl font-light italic text-[var(--lumen-bone)]">
          Escolha uma nova senha.
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading} size="lg">
          {loading ? "A processar…" : "Redefinir senha"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <LumenShell>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10 sm:px-8 lg:px-10">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Suspense fallback={<p className="text-sm text-[var(--lumen-bone-soft)]">A carregar…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </LumenShell>
  );
}
