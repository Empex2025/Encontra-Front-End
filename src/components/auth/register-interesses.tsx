"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { CATEGORIES } from "@/lib/domain/categories";

import { AuthCard, FormError, PrimaryButton, SecondaryButton } from "./auth-card";

export const MIN_INTERESTS = 3;

export function interestsCounter(n: number) {
  if (n === 0) return "Escolha 3 para continuar";
  if (n < MIN_INTERESTS) return `Escolha mais ${MIN_INTERESTS - n} para continuar`;
  return `Ótimo! Você escolheu ${n}.`;
}

/** Etapa 4: pelo menos 3 das 12 categorias, gravadas na ordem em que foram marcadas. */
export function RegisterInteresses({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (ids: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const enough = picked.length >= MIN_INTERESTS;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (!enough || busy) return;
    setBusy(true);
    try {
      await authApi.saveInterests(picked);
      onDone(picked);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Não foi possível salvar. Tente de novo.");
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Seus interesses"
      subtitle="Escolha pelo menos 3 para vermos o que mostrar primeiro."
      step={{ current: 4, total: 4, label: "Interesses" }}
      wide
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const on = picked.includes(c.id);
            const Icon = c.icon;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "relative flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center text-sm font-semibold",
                    on
                      ? "border-primary bg-selected text-text-strong"
                      : "border-border bg-surface text-text-2 hover:border-navy-300",
                  )}
                >
                  <Icon className="size-6" style={{ color: c.colorVar }} aria-hidden />
                  {c.name}
                  {on && (
                    <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-1.5" role="status">
          <div className="flex items-center justify-between text-sm">
            <span className={cn("font-semibold", enough ? "text-success-text" : "text-text-muted")}>
              {interestsCounter(picked.length)}
            </span>
            <span className="text-text-subtle">{picked.length} de 12</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                enough ? "bg-success-text" : "bg-accent",
              )}
              style={{ width: `${Math.min(100, (picked.length / MIN_INTERESTS) * 100)}%` }}
            />
          </div>
        </div>

        {tried && !enough && (
          <p role="alert" className="text-sm text-danger-text">
            Escolha pelo menos 3 interesses para continuar.
          </p>
        )}
        {serverError && <FormError>{serverError}</FormError>}

        <div className="flex gap-3">
          <SecondaryButton onClick={onBack}>Voltar</SecondaryButton>
          <div className="flex-1 [&>button]:w-full">
            <PrimaryButton looksDisabled={!enough} loading={busy}>
              {busy ? "Salvando…" : "Concluir"}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
