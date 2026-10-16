"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { CATEGORIES } from "@/lib/domain/categories";

import {
  ActionRow,
  AuthBackdrop,
  AuthPanel,
  FormError,
  PrimaryButton,
  SecondaryButton,
  StepHeader,
} from "./auth-card";
import { FieldError } from "./auth-fields";

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
    <AuthBackdrop footer="Você pode mudar seus interesses depois, no seu perfil.">
      <AuthPanel width={800} labelledBy="interesses-title">
        <StepHeader
          id="interesses-title"
          title="Seus interesses"
          subtitle="Escolha pelo menos 3 para personalizar o que aparece para você."
          current={4}
        />
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <div
            role="group"
            aria-label="Interesses"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            {CATEGORIES.map((c) => {
              const on = picked.includes(c.id);
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "relative flex h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-semibold text-text transition-all hover:-translate-y-px",
                    on
                      ? "border-primary bg-selected ring-1 ring-primary"
                      : "border-border bg-surface hover:border-navy-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full",
                      on ? "bg-primary text-on-primary" : "bg-surface-2",
                    )}
                    style={on ? undefined : { color: c.colorVar }}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="px-1 text-center leading-[18px]">{c.name}</span>
                  {on && (
                    <span className="anim-pop absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-amber text-navy">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2" role="status">
            <div className="flex items-center justify-between text-xs leading-4">
              <span className={cn("font-semibold", enough ? "text-success-text" : "text-text-muted")}>
                {interestsCounter(picked.length)}
              </span>
              <span className="text-text-subtle">{picked.length} de 12</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              <span
                className={cn(
                  "block h-full rounded-full transition-[width] duration-200",
                  enough ? "bg-success" : "bg-amber",
                )}
                style={{ width: `${Math.min(100, Math.round((picked.length / MIN_INTERESTS) * 100))}%` }}
              />
            </div>
            {tried && !enough && <FieldError>Escolha pelo menos 3 interesses para continuar.</FieldError>}
          </div>

          {serverError && <FormError>{serverError}</FormError>}

          <ActionRow>
            <SecondaryButton onClick={onBack}>Voltar</SecondaryButton>
            <PrimaryButton looksDisabled={!enough} loading={busy}>
              {busy ? "Salvando…" : "Concluir"}
            </PrimaryButton>
          </ActionRow>
        </form>
      </AuthPanel>
    </AuthBackdrop>
  );
}
