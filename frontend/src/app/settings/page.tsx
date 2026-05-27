"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LumenEyebrow, LumenHeader, LumenPanel, LumenShell } from "@/components/LumenChrome";
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
      <LumenShell>
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
          <LumenPanel className="w-full gap-5">
            <LumenEyebrow>Configurações</LumenEyebrow>
            <p className="text-base text-destructive">{loadError}</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-fit text-sm italic text-[var(--lumen-bone-soft)] transition-colors hover:text-[var(--lumen-bone)]"
            >
              ← Voltar ao painel
            </button>
          </LumenPanel>
        </div>
      </LumenShell>
    );
  }

  if (!settings) {
    return (
      <LumenShell>
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
          <p className="text-lg italic text-muted-foreground">A carregar configurações…</p>
        </div>
      </LumenShell>
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
    <LumenShell>
      <LumenHeader
        current="Configurações"
        rightSlot={
          <button
            type="button"
            onClick={() => router.push("/")}
            className="lumen-sc text-[10px] text-[var(--lumen-bone-muted)] transition-colors hover:text-[var(--lumen-bone)]"
          >
            ← Voltar ao painel
          </button>
        }
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-10 pt-10 sm:px-8 lg:px-10">
        <div className="space-y-3">
          <LumenEyebrow>Configurações</LumenEyebrow>
          <h1 className="text-5xl font-light italic tracking-[-0.03em] text-[var(--lumen-bone)]">
            Ajuste o ritmo e o comentador.
          </h1>
          <p className="max-w-2xl text-lg italic text-[var(--lumen-bone-soft)]">
            Escolha quem comenta suas cartas, quantas palavras novas entram por
            dia e se deseja manter as vogais hebraicas sempre visíveis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <LumenPanel className="gap-5">
            <div className="space-y-2">
              <LumenEyebrow>I · Provedor de IA</LumenEyebrow>
              <h2 className="text-3xl font-light italic text-[var(--lumen-bone)]">
                Quem comenta seus estudos
              </h2>
              <p className="text-sm italic text-[var(--lumen-bone-soft)]">
                O provedor escolhido escreve notas, explicações e variações de
                resposta nas cartas.
              </p>
            </div>

            <div className="space-y-3">
              {PROVIDERS.map((provider) => {
                const selected = settings.preferred_provider === provider.value;
                return (
                  <button
                    key={provider.value}
                    type="button"
                    onClick={() =>
                      setSettings({ ...settings, preferred_provider: provider.value })
                    }
                    className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[24px] border px-5 py-4 text-left transition-all ${
                      selected
                        ? "border-[var(--lumen-gold)] bg-[rgba(229,184,95,0.1)] shadow-[0_0_24px_rgba(229,184,95,0.16)]"
                        : "border-[var(--lumen-hairline-soft)] bg-[rgba(18,26,51,0.45)] hover:bg-[rgba(18,26,51,0.62)]"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full border ${
                        selected
                          ? "border-[var(--lumen-gold)] bg-[var(--lumen-gold)] shadow-[0_0_12px_rgba(229,184,95,0.45)]"
                          : "border-[var(--lumen-bone-muted)] bg-transparent"
                      }`}
                    />
                    <div>
                      <div className="text-xl italic text-[var(--lumen-bone)]">
                        {provider.label.split(" (")[0]}
                      </div>
                      <div className="lumen-sc mt-1 text-[9px] text-[var(--lumen-bone-muted)]">
                        {provider.label}
                      </div>
                    </div>
                    {selected ? (
                      <span className="lumen-sc text-[9px] text-[var(--lumen-gold)]">
                        ativo
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </LumenPanel>

          <LumenPanel className="gap-8">
            <div className="space-y-2">
              <LumenEyebrow>II · Sessão de estudo</LumenEyebrow>
              <h2 className="text-3xl font-light italic text-[var(--lumen-bone)]">
                Ritmo e vogais
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm italic text-[var(--lumen-bone-soft)]">
                    Novas palavras por dia
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-6xl leading-none font-light tracking-[-0.04em] text-[var(--lumen-gold)] drop-shadow-[0_0_20px_rgba(229,184,95,0.28)]">
                      {settings.daily_new_limit}
                    </span>
                    <span className="pb-2 text-sm italic text-[var(--lumen-bone-soft)]">
                      palavras / dia
                    </span>
                  </div>
                </div>
                <span className="lumen-kbd">1 — 50</span>
              </div>

              <input
                id="daily_new_limit"
                type="range"
                min={1}
                max={50}
                value={settings.daily_new_limit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    daily_new_limit: (() => {
                      const n = parseInt(e.target.value, 10);
                      return Math.max(1, Math.min(50, isNaN(n) ? 1 : n));
                    })(),
                  })
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(229,184,95,0.12)] accent-[var(--lumen-gold)]"
              />
              <p className="text-sm italic text-[var(--lumen-bone-soft)]">
                Entre 1 e 50 palavras novas por dia.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, show_niqqud: true })}
                className={`rounded-[24px] border px-5 py-5 text-center transition-all ${
                  settings.show_niqqud
                    ? "border-[var(--lumen-gold)] bg-[rgba(229,184,95,0.1)] shadow-[0_0_24px_rgba(229,184,95,0.16)]"
                    : "border-[var(--lumen-hairline-soft)] bg-[rgba(18,26,51,0.45)]"
                }`}
              >
                <div
                  dir="rtl"
                  lang="he"
                  className="text-5xl text-[var(--lumen-bone)] [font-family:var(--font-hebrew)] drop-shadow-[0_0_20px_rgba(229,184,95,0.2)]"
                >
                  שָׁלוֹם
                </div>
                <div className="lumen-sc mt-4 text-[9px] text-[var(--lumen-gold)]">
                  com vogais
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, show_niqqud: false })}
                className={`rounded-[24px] border px-5 py-5 text-center transition-all ${
                  !settings.show_niqqud
                    ? "border-[var(--lumen-gold)] bg-[rgba(229,184,95,0.1)] shadow-[0_0_24px_rgba(229,184,95,0.16)]"
                    : "border-[var(--lumen-hairline-soft)] bg-[rgba(18,26,51,0.45)]"
                }`}
              >
                <div
                  dir="rtl"
                  lang="he"
                  className="text-5xl text-[var(--lumen-bone-soft)] [font-family:var(--font-hebrew)]"
                >
                  שלום
                </div>
                <div className="lumen-sc mt-4 text-[9px] text-[var(--lumen-bone-muted)]">
                  sem vogais
                </div>
              </button>
            </div>

            <Button
              type="submit"
              disabled={saveState !== "idle"}
              className="w-full"
              size="lg"
            >
              {saveLabel}
            </Button>
          </LumenPanel>
        </form>
      </div>
    </LumenShell>
  );
}
