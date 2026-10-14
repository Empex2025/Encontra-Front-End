"use client";

import Link from "next/link";
import { useState } from "react";

import { PasswordField, TextField } from "@/components/ui/text-field";
import { authApi, type OtpChallenge } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  isValidCpf,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  maskCpf,
  maskPhone,
  onlyDigits,
  passwordChecks,
} from "@/lib/domain/validation";
import { routes } from "@/lib/routes";

import { AuthCard, FormError, PrimaryButton } from "./auth-card";

export type DadosForm = { name: string; cpf: string; email: string; phone: string; password: string };

const fieldMap: Record<string, keyof DadosForm> = {
  name: "name",
  cpf: "cpf",
  email: "email",
  phone: "phone",
  password: "password",
};

/** Etapa 1: dados pessoais, senha e aceite dos termos. Cria a conta pendente e dispara o SMS. */
export function RegisterDados({
  initial,
  onDone,
}: {
  initial: DadosForm;
  onDone: (form: DadosForm, challenge: OtpChallenge) => void;
}) {
  const [f, setF] = useState(initial);
  const [accepted, setAccepted] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverFields, setServerFields] = useState<Partial<Record<keyof DadosForm, string>>>({});
  const [serverError, setServerError] = useState("");

  const set = (k: keyof DadosForm, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setServerFields((p) => ({ ...p, [k]: undefined }));
  };

  const name = f.name.trim();
  const cpfDigits = onlyDigits(f.cpf);
  const checks = passwordChecks(f.password);
  const errors = {
    name: name.length < 3 || name.length > 60 ? "Digite seu nome." : undefined,
    cpf:
      cpfDigits.length < 11
        ? "CPF incompleto (11 números)."
        : !isValidCpf(f.cpf)
          ? "CPF inválido. Confira os números."
          : undefined,
    email: !isValidEmail(f.email) ? "Digite um e-mail válido." : undefined,
    phone: !isValidPhone(f.phone) ? "Celular com DDD (11 números)." : undefined,
    password: !isValidPassword(f.password) ? "Use de 8 a 64 caracteres, com letras e números." : undefined,
  };
  const valid = Object.values(errors).every((e) => !e) && accepted;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (!valid || busy) return;
    setBusy(true);
    try {
      const challenge = await authApi.register({
        name,
        cpf: cpfDigits,
        email: f.email.trim(),
        phone: onlyDigits(f.phone),
        password: f.password,
        acceptTerms: true,
      });
      onDone(f, challenge);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        const next: Partial<Record<keyof DadosForm, string>> = {};
        for (const [k, msg] of Object.entries(err.fields)) {
          const key = fieldMap[k];
          if (key) next[key] = msg;
        }
        setServerFields(next);
      }
      setServerError(
        err instanceof ApiError ? err.message : "Não foi possível criar a conta. Tente de novo em instantes.",
      );
      setBusy(false);
    }
  };

  const err = (k: keyof DadosForm) => serverFields[k] ?? (tried ? errors[k] : undefined);

  return (
    <AuthCard
      title="Crie sua conta"
      subtitle="Preencha seus dados. Leva menos de 1 minuto."
      step={{ current: 1, total: 4, label: "Seus dados" }}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nome completo"
          value={f.name}
          onChange={(e) => set("name", e.target.value.slice(0, 60))}
          autoComplete="name"
          error={err("name")}
        />
        <TextField
          label="CPF"
          value={f.cpf}
          onChange={(e) => set("cpf", maskCpf(e.target.value))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          hint="Usamos o CPF para identificar você com segurança e, no futuro, para pagamentos e notas fiscais. Ele não aparece para as lojas."
          error={err("cpf")}
        />
        <TextField
          label="E-mail"
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value.slice(0, 80))}
          autoComplete="email"
          error={err("email")}
        />
        <TextField
          label="Telefone de contato"
          value={f.phone}
          onChange={(e) => set("phone", maskPhone(e.target.value))}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(00) 0 0000-0000"
          hint="Vamos confirmar por SMS."
          error={err("phone")}
        />
        <PasswordField
          label="Senha"
          value={f.password}
          onChange={(e) => set("password", e.target.value.slice(0, 64))}
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com letras e números."
          hintTone={checks.length && checks.lettersAndNumbers ? "ok" : tried ? "bad" : "neutral"}
          error={serverFields.password}
        />

        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-3 text-sm text-text-2">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              aria-invalid={tried && !accepted}
              className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
            />
            <span>
              Li e aceito os{" "}
              <Link
                href="/institucional/termos"
                target="_blank"
                className="font-semibold text-link underline"
              >
                Termos de uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/institucional/privacidade"
                target="_blank"
                className="font-semibold text-link underline"
              >
                Política de privacidade
              </Link>
              .
            </span>
          </label>
          {tried && !accepted && (
            <p role="alert" className="text-sm text-danger-text">
              Para criar a conta, aceite os termos.
            </p>
          )}
        </div>

        {serverError && <FormError>{serverError}</FormError>}

        <div className="flex gap-3">
          <Link
            href={routes.entrar}
            className="flex h-12 items-center rounded-lg border border-border-strong px-5 text-base font-semibold text-text-2 hover:bg-surface-2"
          >
            Cancelar
          </Link>
          <div className="flex-1 [&>button]:w-full">
            <PrimaryButton looksDisabled={!valid} loading={busy}>
              {busy ? "Criando…" : "Próximo"}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
