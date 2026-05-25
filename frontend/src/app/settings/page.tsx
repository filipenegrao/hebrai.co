"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSettings, updateSettings, type UserSettings } from "@/lib/api";

const PROVIDERS: { value: string; label: string }[] = [
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gpt-4o", label: "GPT-4o (OpenAI)" },
  { value: "gemini", label: "Gemini (Google)" },
  { value: "ollama", label: "Ollama (local)" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setLoadError("Não foi possível carregar as configurações."));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!settings) return;
    setSaveState("saving");
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  if (loadError) {
    return (
      <main className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
        <p className="text-sm text-destructive">{loadError}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar ao painel
        </button>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="min-h-screen p-6 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">A carregar configurações…</p>
      </main>
    );
  }

  const saveLabel =
    saveState === "saving"
      ? "A guardar…"
      : saveState === "saved"
        ? "Guardado!"
        : saveState === "error"
          ? "Erro ao guardar"
          : "Guardar configurações";

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar ao painel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Provedor de IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="preferred_provider">Provedor preferido</Label>
              <select
                id="preferred_provider"
                value={settings.preferred_provider}
                onChange={(e) =>
                  setSettings({ ...settings, preferred_provider: e.target.value })
                }
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessão de estudo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="daily_new_limit">Novas palavras por dia</Label>
              <Input
                id="daily_new_limit"
                type="number"
                min={1}
                max={50}
                value={settings.daily_new_limit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    daily_new_limit: (() => { const n = parseInt(e.target.value, 10); return Math.max(1, Math.min(50, isNaN(n) ? 1 : n)); })(),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Entre 1 e 50 palavras novas por dia.</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="show_niqqud"
                type="checkbox"
                checked={settings.show_niqqud}
                onChange={(e) =>
                  setSettings({ ...settings, show_niqqud: e.target.checked })
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="show_niqqud">Mostrar niqqud (vogais hebraicas)</Label>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={saveState !== "idle"}
          className="w-full"
          size="lg"
        >
          {saveLabel}
        </Button>
      </form>
    </main>
  );
}
